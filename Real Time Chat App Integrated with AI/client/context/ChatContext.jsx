import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import { data } from "react-router-dom";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // function to get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to get messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to send message to selected user
  const sendMessage = async (messageData, receiverId = null) => {
    const targetId = receiverId || selectedUser?._id;
    if (!targetId) return;

    try {
      const { data } = await axios.post(
        `/api/messages/send/${targetId}`,
        messageData
      );
      if (data.success) {
        if (selectedUser && selectedUser._id.toString() === targetId.toString()) {
          setMessages((preMessages) => [...preMessages, data.newMessage]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to edit message
  const editMessageContext = async (messageId, updateData) => {
    try {
      const { data } = await axios.put(`/api/messages/edit/${messageId}`, updateData);
      if (data.success) {
        setMessages((prevMessages) => prevMessages.map((msg) => msg._id === messageId ? data.message : msg));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to delete message
  const deleteMessageContext = async (messageId, type = "everyone") => {
    try {
      const { data } = await axios.delete(`/api/messages/delete/${messageId}`, {
        data: { type },
      });
      if (data.success) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to vote on a poll
  const votePoll = async (messageId, optionIndex) => {
    try {
      const { data } = await axios.post(`/api/messages/poll/vote`, { messageId, optionIndex });
      if (data.success) {
        setMessages((prevMessages) => prevMessages.map((msg) => msg._id === messageId ? data.message : msg));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to subscribe to messages for selected user
  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && (newMessage.senderId.toString() === selectedUser._id.toString() || newMessage.receiverId.toString() === selectedUser._id.toString())) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
        // Notify the sender that we saw the new message
        socket.emit("messageSeen", { messageId: newMessage._id, senderId: newMessage.senderId, receiverId: newMessage.receiverId });
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });

    socket.on("messagesSeen", ({ senderId, receiverId }) => {
      // If the current user is the one who sent those messages, mark them as read in state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.senderId.toString() === senderId.toString() && msg.receiverId.toString() === receiverId.toString()
            ? { ...msg, seen: true }
            : msg
        )
      );
    });

    socket.on("messageEdited", (editedMessage) => {
      setMessages((prevMessages) => prevMessages.map((msg) => msg._id === editedMessage._id ? editedMessage : msg));
    });

    socket.on("messageDeleted", (deletedMessageId) => {
      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== deletedMessageId));
    });

    socket.on("pollUpdated", (updatedMessage) => {
      setMessages((prevMessages) => prevMessages.map((msg) => msg._id === updatedMessage._id ? updatedMessage : msg));
    });

    socket.on("userUpdated", (updatedUser) => {
      setUsers((prevUsers) => prevUsers.map((u) => u._id === updatedUser._id ? updatedUser : u));
      if (selectedUser && selectedUser._id.toString() === updatedUser._id.toString()) {
        setSelectedUser(updatedUser);
      }
    });
  };

  // function to unsubscribe from messages
  const unsubscribeFromMessages = () => {
    if (socket) {
      socket.off("newMessage");
      socket.off("messagesSeen");
      socket.off("messageEdited");
      socket.off("messageDeleted");
      socket.off("pollUpdated");
    }
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    editMessage: editMessageContext,
    deleteMessage: deleteMessageContext,
    votePoll,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
