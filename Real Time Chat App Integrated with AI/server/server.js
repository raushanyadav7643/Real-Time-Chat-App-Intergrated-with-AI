import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import { Server } from "socket.io";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import dns from 'dns'
import Message from "./models/Message.js";

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Store active calls to track missed calls
const activeCalls = new Map(); // Map<userId, { to, type, answered }>

// Create Expree app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId?.toString().trim();

  if (userId && userId !== "undefined" && userId !== "") {
    userSocketMap[userId] = socket.id;
    socket.join(userId); // Join a room named after the userId
    console.log(`User Connected: ${userId} with Socket: ${socket.id}, joined room: ${userId}`);
  }

  //Emit online users to all connected client as strings
  io.emit("getOnlineUsers", Object.keys(userSocketMap).map(id => id.toString()));

  socket.on("call-user", async ({ to, offer, type, fromName, fromPic }) => {
    // Normalize string for safety
    const targetUserId = to?.toString().trim();

    console.log(`[SIGNALING] Attempting call from ${userId} to ${targetUserId}.`);

    if (userSocketMap[targetUserId]) {
      // Start server-side ringing timeout (28 seconds)
      const ringingTimeout = setTimeout(() => {
        console.log(`[SIGNALING] Call from ${userId} to ${targetUserId} timed out on server.`);
        handleEndCall(userId, true); // Record as missed call
      }, 28000);

      // Record the call as pending with timeout
      activeCalls.set(userId, {
        to: targetUserId,
        type,
        answered: false,
        timeoutId: ringingTimeout
      });

      console.log(`[SIGNALING] Forwarding call to user room: ${targetUserId}`);
      io.to(targetUserId).emit("incoming-call", { from: userId, offer, type, fromName, fromPic });
    } else {
      console.log(`[SIGNALING] User ${targetUserId} is offline. Recording persistent missed call.`);

      try {
        const missedMessage = await Message.create({
          senderId: userId.toString(),
          receiverId: targetUserId.toString(),
          call: {
            type: type, // 'voice' or 'video'
            status: "missed",
          }
        });

        console.log(`[DB] Offline missed call saved: ${missedMessage._id}`);

        const messageObj = missedMessage.toObject();
        // Emit to the caller so they see "No Answer"
        socket.emit("newMessage", messageObj);

        // Even if offline, emit to receiver's room as a fail-safe for multi-device sync
        io.to(targetUserId.toString()).emit("newMessage", messageObj);

        socket.emit("call-error", { message: "User is offline. Notification sent." });
      } catch (error) {
        console.error("Error recording offline missed call:", error);
        socket.emit("call-error", { message: "User is currently unreachable" });
      }
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const targetUserId = to?.toString().trim();

    // Find the call and clear the server-side ringing timeout
    for (const [callerId, call] of activeCalls.entries()) {
      if (call.to === userId && callerId === targetUserId) {
        if (call.timeoutId) {
          clearTimeout(call.timeoutId);
          call.timeoutId = null;
        }
        call.answered = true;
        console.log(`[SIGNALING] Call from ${callerId} to ${userId} answered. Timeout cleared.`);
        break;
      }
    }

    io.to(targetUserId).emit("call-answered", { answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetUserId = to?.toString().trim();
    io.to(targetUserId).emit("ice-candidate", { candidate });
  });

  const handleEndCall = async (callerId, recordMissed = true) => {
    const call = activeCalls.get(callerId);
    if (call) {
      console.log(`[SIGNALING] Ending call from ${callerId} to ${call.to}. Answered: ${call.answered}, Record Missed: ${recordMissed}`);

      // Clear ringing timeout if it's still running
      if (call.timeoutId) {
        clearTimeout(call.timeoutId);
      }

      const receiverId = call.to;
      const senderId = callerId;

      if (!call.answered && recordMissed) {
        // Record missed call
        try {
          const missedMessage = await Message.create({
            senderId: callerId,
            receiverId: call.to,
            call: {
              type: call.type,
              status: "missed",
            }
          });

          console.log(`[DB] Missed call recorded: ${missedMessage._id}`);

          const messageObj = missedMessage.toObject();
          io.to(receiverId.toString()).emit("newMessage", messageObj);
          io.to(senderId.toString()).emit("newMessage", messageObj);
        } catch (error) {
          console.error("Error recording missed call:", error);
        }
      }

      // ALWAYS notify both parties to close their UI via their rooms
      io.to(receiverId.toString()).emit("call-ended");
      io.to(senderId.toString()).emit("call-ended");

      activeCalls.delete(callerId);
    }
  };

  socket.on("end-call", ({ to, reason }) => {
    console.log(`[SIGNALING] end-call received from ${userId} to ${to} (Reason: ${reason})`);
    // If issuer is the caller
    if (activeCalls.has(userId)) {
      handleEndCall(userId, true);
    }
    // If issuer is the target
    else {
      for (const [callerId, call] of activeCalls.entries()) {
        if (call.to === userId) {
          handleEndCall(callerId, reason === "reject" ? false : true);
          break;
        }
      }
    }
  });

  socket.on("messageSeen", ({ messageId, senderId, receiverId }) => {
    const targetSocketId = userSocketMap[senderId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("messagesSeen", { senderId, receiverId });
    }
  });

  socket.on("updateProfile", (updatedUser) => {
    socket.broadcast.emit("userUpdated", updatedUser);
  });

  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId] === socket.id) {
      console.log("User Disconnected:", userId);

      // Handle missed calls where this user was either caller or receiver
      if (activeCalls.has(userId)) {
        handleEndCall(userId, true);
      } else {
        for (const [callerId, call] of activeCalls.entries()) {
          if (call.to === userId) {
            handleEndCall(callerId, true);
            break;
          }
        }
      }

      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap).map(id => id.toString()));
  });
});

// Middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Route setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/ai", aiRouter);
// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
