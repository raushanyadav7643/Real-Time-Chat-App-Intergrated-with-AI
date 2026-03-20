import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    image: { type: String },
    video: { type: String },
    audio: { type: String },
    document: { type: String },
    fileName: { type: String },
    seen: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    poll: {
      question: { type: String },
      options: [
        {
          text: { type: String, required: true },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
    },
    event: {
      title: { type: String },
      date: { type: String },
      time: { type: String },
      location: { type: String },
    },
    call: {
      type: { type: String, enum: ["voice", "video"] },
      status: { type: String, enum: ["connected", "missed"] },
      duration: { type: String },
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
