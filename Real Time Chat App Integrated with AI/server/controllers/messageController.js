import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    // Count number of message not seen
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
      deletedBy: { $ne: myId },
    });
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId, seen: false },
      { seen: true }
    );

    // Notify the sender that their messages were seen
    const senderSocketId = userSocketMap[selectedUserId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { senderId: selectedUserId, receiverId: myId });
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Send Message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image, video, audio, document, fileName, location, poll, event, call } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let videoUrl;
    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
      });
      videoUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "auto",
      });
      audioUrl = uploadResponse.secure_url;
    }

    let documentUrl;
    if (document) {
      const uploadResponse = await cloudinary.uploader.upload(document, {
        resource_type: "raw",
      });
      documentUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      document: documentUrl,
      fileName,
      location,
      ...(poll && poll.question ? { poll } : {}),
      ...(event && event.title ? { event } : {}),
      call,
    });

    // Emit the new message to the reciver's socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Edit Message
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, event, poll } = req.body;
    const senderId = req.user._id;

    const updateData = { isEdited: true };
    if (text !== undefined) updateData.text = text;
    if (event !== undefined) updateData.event = event;
    if (poll !== undefined) updateData.poll = poll;

    const message = await Message.findOneAndUpdate(
      { _id: id, senderId },
      updateData,
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found or unauthorized" });
    }

    // Emit edited message event
    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Delete Message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'me' or 'everyone'
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (type === "everyone") {
      // Only sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized to delete for everyone" });
      }

      // Delete from Cloudinary if there are attachments
      const attachments = [
        { url: message.image, type: 'image' },
        { url: message.video, type: 'video' },
        { url: message.audio, type: 'video' }, // Audio is handled as 'video' resource_type in Cloudinary
        { url: message.document, type: 'raw' }
      ];

      for (const item of attachments) {
        if (item.url) {
          try {
            const publicId = item.url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId, { resource_type: item.type });
          } catch (cloudinaryError) {
            console.error(`Cloudinary deletion failed for ${item.type}:`, cloudinaryError.message);
          }
        }
      }

      await Message.findByIdAndDelete(id);

      // Emit deleted message event to both participants
      const receiverSocketId = userSocketMap[message.receiverId];
      const senderSocketId = userSocketMap[message.senderId];

      if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", id);
      if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", id);

    } else if (type === "me") {
      // Delete for me: add userId to deletedBy array
      await Message.findByIdAndUpdate(id, {
        $addToSet: { deletedBy: userId }
      });
    }

    res.json({ success: true, messageId: id, type });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Vote on a Poll
export const votePoll = async (req, res) => {
  try {
    const { messageId, optionIndex } = req.body;
    const userId = req.user._id;

    // Find message with this poll
    const message = await Message.findById(messageId);
    if (!message || !message.poll) {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    // Check if user already voted for this option
    const alreadyVoted = message.poll.options[optionIndex].votes.includes(userId);

    // Remove user's vote from ALL options first (one person one vote)
    message.poll.options.forEach(opt => {
      const idx = opt.votes.indexOf(userId);
      if (idx > -1) opt.votes.splice(idx, 1);
    });

    // If they weren't clicking their current vote to remove it, add the new vote
    if (!alreadyVoted) {
      message.poll.options[optionIndex].votes.push(userId);
    }

    await message.save();

    // Emit poll update to both participants
    const receiverSocketId = userSocketMap[message.receiverId];
    const senderSocketId = userSocketMap[message.senderId];

    if (receiverSocketId) io.to(receiverSocketId).emit("pollUpdated", message);
    if (senderSocketId) io.to(senderSocketId).emit("pollUpdated", message);

    res.json({ success: true, message });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
