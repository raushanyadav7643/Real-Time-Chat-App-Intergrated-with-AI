import React, { useContext, useEffect, useRef, useState } from "react";
import assets, { messagesDummyData } from "../assets/assets";
import { formatMessageTime, formatChatDate } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { CallContext } from "../../context/CallContext";
import { ThemeContext } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageStatus = ({ seen }) => {
  if (seen) {
    return (
      <div className="flex items-center -space-x-1.5 ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400">
          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400">
          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex ml-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white/30">
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, editMessage, deleteMessage, votePoll } =
    useContext(ChatContext);
  const { authUser, onlineUsers, axios } = useContext(AuthContext);
  const { startCall } = useContext(CallContext);
  const { theme, isDark } = useContext(ThemeContext);

  const scrollEnd = useRef();
  const attachmentMenuRef = useRef();
  const emojiPickerRef = useRef();
  const attachmentButtonRef = useRef();
  const emojiButtonRef = useRef();

  const imageInputRef = useRef();
  const docInputRef = useRef();
  const cameraInputRef = useRef();

  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMode, setAiMode] = useState("question");
  const [pollData, setPollData] = useState({ question: "", options: ["", ""] });
  const [eventData, setEventData] = useState({ title: "", date: "", time: "", location: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, messageId: null, isSender: false });

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef(null);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (input.trim() === "") return null;

    if (editingMessage) {
      await editMessage(editingMessage._id, { text: input.trim() });
      setEditingMessage(null);
    } else {
      await sendMessage({ text: input.trim() });
    }

    setInput("");
    setShowEmojiPicker(false);
  };

  // Handle various file attachments
  // Helper for sending media (images/videos)
  const sendMedia = async (data, type) => {
    if (!data) return;
    const loadingToast = toast.loading(`Sending ${type}...`);
    try {
      await sendMessage({
        [type]: data,
        text: input.trim() || undefined
      });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sent`, { id: loadingToast });
      setInput("");
      setShowAttachmentMenu(false);
    } catch (error) {
      toast.error(`Failed to send ${type}`, { id: loadingToast });
    }
  };

  const handleSendImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return toast.error("Please select an image or video file");

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMedia(reader.result, isImage ? "image" : "video");
      e.target.value = "";
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
  };

  const handleSendDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingToast = toast.loading("Sending document...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await sendMessage({
          document: reader.result,
          fileName: file.name,
          text: input.trim() || undefined
        });
        toast.success("Document sent", { id: loadingToast });
        setInput("");
      } catch (error) {
        toast.error("Failed to send document", { id: loadingToast });
      }
      e.target.value = "";
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
  };

  const startCamera = async () => {
    setShowAttachmentMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      // Removed direct videoRef assignment here as it will be null until rerender
    } catch (error) {
      toast.error("Could not access camera");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Ensure video has loaded data to get correct dimensions
      if (video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

      sendMedia(dataUrl, "image");
      stopCamera();
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    const loadingToast = toast.loading("Getting location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await sendMessage({
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            text: input.trim() || undefined
          });
          toast.success("Location shared", { id: loadingToast });
          setInput("");
          setShowAttachmentMenu(false);
        } catch (error) {
          toast.error("Failed to share location", { id: loadingToast });
        }
      },
      () => toast.error("Could not get location", { id: loadingToast })
    );
  };

  const handleSendPoll = async () => {
    if (!pollData.question.trim()) return toast.error("Enter a question");
    const options = pollData.options.filter(opt => opt.trim() !== "");
    if (options.length < 2) return toast.error("Need at least 2 options");
    try {
      await sendMessage({
        poll: { question: pollData.question, options: options.map(o => ({ text: o, votes: [] })) },
        text: input.trim() || undefined
      });
      setShowPollModal(false);
      setPollData({ question: "", options: ["", ""] });
      setInput("");
      setShowAttachmentMenu(false);
    } catch (e) { toast.error("Failed to create poll"); }
  };

  const handleSendEvent = async () => {
    if (!eventData.title.trim() || !eventData.date || !eventData.time) return toast.error("Fill in all details");
    try {
      if (editingMessage?.event) {
        await editMessage(editingMessage._id, {
          event: eventData,
          text: input.trim() || undefined
        });
        setEditingMessage(null);
      } else {
        await sendMessage({
          event: eventData,
          text: input.trim() || undefined
        });
      }
      setShowEventModal(false);
      setEventData({ title: "", date: "", time: "", location: "" });
      setInput("");
      setShowAttachmentMenu(false);
    } catch (e) { toast.error("Failed to share event"); }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error("Please enter a prompt");
    setIsGenerating(true);

    try {
      const { data } = await axios.post("/api/ai/ask", { prompt: aiPrompt });
      setAiResponse(data.response);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to get AI response";
      toast.error(errorMsg);
      setAiResponse("AI Assistant currently unavailable. If the issue persists, please try again in a few moments or contact support.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [aiResponse, setAiResponse] = useState("");

  const handleSendAIGenerated = async () => {
    if (!aiResponse) return;
    await sendMessage({ text: aiResponse });
    closeAIModal();
  };

  const closeAIModal = () => {
    setShowAIModal(false);
    setAiPrompt("");
    setAiResponse("");
    setIsGenerating(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error("Recording not supported");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => { await sendMessage({ audio: reader.result }); };
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (e) { toast.error("Mic access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startEditing = (msg) => {
    setEditingMessage(msg);
    if (msg.event) {
      setEventData(msg.event);
      setShowEventModal(true);
    } else {
      setInput(msg.text || "");
      setShowEmojiPicker(false);
    }
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setInput("");
    setEventData({ title: "", date: "", time: "", location: "" });
  };

  const openDeleteModal = (msg) => {
    setDeleteModal({ show: true, messageId: msg._id, isSender: msg.senderId === authUser._id });
  };

  const handleDeleteConfirm = async (type) => {
    await deleteMessage(deleteModal.messageId, type);
    setDeleteModal({ show: false, messageId: null, isSender: false });
  };

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  // Effect to handle camera stream assignment
  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      const scrollTimeout = setTimeout(() => {
        scrollEnd.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(scrollTimeout);
    }
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (showAttachmentMenu && !attachmentMenuRef.current?.contains(e.target) && !attachmentButtonRef.current?.contains(e.target)) setShowAttachmentMenu(false);
      if (showEmojiPicker && !emojiPickerRef.current?.contains(e.target) && !emojiButtonRef.current?.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAttachmentMenu, showEmojiPicker]);

  return selectedUser ? (
    <div className={`h-full flex flex-col relative bg-transparent overflow-hidden max-w-4xl mx-auto w-full transition-all duration-500 ${isDark ? 'border-x border-white/5' : 'border-x border-black/5 shadow-2xl bg-white'}`}>
      {/* Header */}
      <div className={`flex-none flex items-center gap-4 p-5 backdrop-blur-2xl z-20 shadow-xl transition-all duration-500 ${isDark ? 'border-b border-white/5 bg-white/[0.02]' : 'border-b border-slate-100 bg-white/80'}`}>
        <div className="relative">
          <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-10 h-10 rounded-2xl object-cover shadow-lg border border-white/10" />
          {onlineUsers.includes(selectedUser._id.toString()) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#020617] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold tracking-tight text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedUser.fullName}</p>
          <div className="flex items-center gap-1.5 leading-none mt-0.5">
            {onlineUsers.includes(selectedUser._id.toString()) ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider">Active Now</span>
              </>
            ) : (
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Offline Now</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => startCall(selectedUser, "voice")} className={`p-3 rounded-2xl transition-all active:scale-90 group ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
          </button>
          <button onClick={() => startCall(selectedUser, "video")} className={`p-3 rounded-2xl transition-all active:scale-90 group ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-6 scroll-smooth custom-scrollbar flex flex-col gap-5 transition-all duration-500 ${isDark ? 'bg-[#0b0d14]/60 backdrop-blur-sm' : 'bg-slate-50/50'}`}>
        {messages && messages.length > 0 && <div className="flex-1" />}
        {authUser && messages && messages.length > 0 ? messages.map((msg, idx) => {
          const isSender = msg.senderId.toString() === authUser._id.toString();

          const showDateHeader = idx === 0 ||
            new Date(messages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

          return (
            <React.Fragment key={msg._id || idx}>
              {showDateHeader && (
                <div className="flex justify-center my-6">
                  <span className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest backdrop-blur-md shadow-xl ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-white border-slate-200 text-slate-400 font-bold'}`}>
                    {formatChatDate(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"}`}>
                {!isSender && <img src={selectedUser.profilePic || assets.avatar_icon} className="w-7 h-7 rounded-full mb-1" alt="" />}
                <div className={`flex flex-col ${isSender ? "items-end" : "items-start"} max-w-[70%] relative group`}>
                  {msg.text && (
                    <div className={`p-4 rounded-[1.5rem] shadow-2xl relative transition-all duration-300 ${isSender ? 'bg-indigo-600 text-white rounded-br-none' : (isDark ? 'bg-[#1e293b]/60 text-white/90 backdrop-blur-md rounded-bl-none border border-white/5' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm')}`}>
                      <p className="text-[15px] leading-relaxed">{msg.text}</p>
                      {msg.isEdited && <span className={`text-[10px] italic block mt-1 ${isSender ? 'text-white/40' : 'text-slate-400'}`}>(edited)</span>}
                    </div>
                  )}
                  {msg.image && (
                    <div className={`p-2 rounded-[1.5rem] shadow-2xl transition-all duration-300 ${isSender ? 'bg-indigo-600 rounded-br-none' : (isDark ? 'bg-[#1e293b]/60 backdrop-blur-md rounded-bl-none border border-white/5' : 'bg-white rounded-bl-none border border-slate-200 shadow-sm')}`}>
                      <img src={msg.image} className="rounded-xl shadow-lg cursor-pointer max-w-full" alt="" onClick={() => setSelectedImage(msg.image)} />
                    </div>
                  )}
                  {msg.video && (
                    <div className={`p-2 rounded-[1.5rem] shadow-2xl ${isSender ? 'bg-indigo-600 rounded-br-none' : 'bg-[#1e293b]/60 backdrop-blur-md rounded-bl-none border border-white/5'}`}>
                      <video src={msg.video} controls className="rounded-xl shadow-lg" />
                    </div>
                  )}
                  {msg.poll && msg.poll.options && msg.poll.options.length > 0 && (
                    <div className={`p-6 rounded-[1.8rem] shadow-2xl min-w-[300px] border border-white/5 backdrop-blur-md ${isSender ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-[#1e293b] text-white rounded-bl-none'}`}>
                      <p className="font-bold text-lg mb-5 tracking-tight">{msg.poll.question}</p>
                      <div className="flex flex-col gap-4">
                        {msg.poll.options.map((o, i) => {
                          const totalVotes = msg.poll.options.reduce((acc, curr) => acc + curr.votes.length, 0);
                          const percentage = totalVotes === 0 ? 0 : Math.round((o.votes.length / totalVotes) * 100);
                          return (
                            <button
                              key={i}
                              onClick={() => votePoll(msg._id, i)}
                              className="group relative overflow-hidden p-4 border border-white/10 rounded-[1.2rem] text-left transition-all active:scale-[0.98] bg-black/20 hover:bg-black/30"
                            >
                              <div className="absolute inset-0 bg-white/5 transition-all duration-700 pointer-events-none" style={{ width: `${percentage}%` }}></div>
                              <div className="relative flex justify-between items-start z-10">
                                <span className="font-bold text-sm">{o.text}</span>
                                <span className="text-[12px] font-black opacity-40">{percentage}%</span>
                              </div>
                              <div className="relative flex justify-end z-10 mt-1">
                                <span className="text-[10px] font-medium opacity-30">{o.votes.length} {o.votes.length === 1 ? 'vote' : 'votes'}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10 opacity-40">
                        <p className="text-[10px] font-black uppercase tracking-widest italic">{msg.poll.options.reduce((a, c) => a + c.votes.length, 0)} total votes</p>
                        <p className="text-[10px] font-bold">{formatMessageTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  )}
                  {msg.document && (
                    <a
                      href={msg.document}
                      download={msg.fileName || "Document"}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-4 rounded-[1.5rem] shadow-2xl border border-white/5 backdrop-blur-md flex items-center gap-4 transition-all hover:scale-[1.02] cursor-pointer ${isSender ? 'bg-indigo-600 rounded-br-none' : 'bg-[#1e293b] rounded-bl-none'}`}
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white/80"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold truncate text-white">{msg.fileName || 'Document'}</p>
                        <p className="text-[9px] opacity-50 uppercase font-black tracking-widest mt-0.5">DOCUMENT • {formatMessageTime(msg.createdAt)}</p>
                      </div>
                      <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/5 shadow-lg group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0 4.5-4.5M12 16.5V3" /></svg>
                      </div>
                    </a>
                  )}
                  {msg.audio && (
                    <div className={`p-3 rounded-[1.5rem] shadow-2xl border border-white/5 backdrop-blur-md ${isSender ? 'bg-indigo-600 rounded-br-none' : 'bg-[#1e293b] rounded-bl-none'}`}>
                      <audio src={msg.audio} controls className="h-8 max-w-[220px]" />
                    </div>
                  )}
                  {msg.location && (
                    <a href={`https://maps.google.com/?q=${msg.location.lat},${msg.location.lng}`} target="_blank" rel="noreferrer" className={`p-4 rounded-[1.5rem] shadow-2xl border border-white/5 backdrop-blur-md flex items-center gap-3 transition-all hover:scale-[1.02] ${isSender ? 'bg-indigo-600 rounded-br-none' : 'bg-[#1e293b] rounded-bl-none'}`}>
                      <div className="p-2 bg-white/10 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Shared Location</p>
                        <p className="text-[10px] opacity-40 font-black tracking-widest uppercase">Tap to open maps</p>
                      </div>
                    </a>
                  )}
                  {msg.event && (
                    <div className={`p-6 rounded-[1.5rem] shadow-2xl min-w-[300px] border border-white/10 flex flex-col gap-4 relative overflow-hidden ${isSender ? 'bg-indigo-600' : 'bg-[#1e293b]'} text-white`}>
                      <div className="flex items-center gap-4">
                        <div className="bg-white/15 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[65px]">
                          <span className="text-[10px] font-black uppercase opacity-60 leading-none mb-1">{new Date(msg.event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                          <span className="text-2xl font-black leading-none">{new Date(msg.event.date).getDate()}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-xl tracking-tight leading-tight">{msg.event.title}</p>
                          <p className="text-xs font-bold opacity-60 flex items-center gap-1.5 mt-1.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> {msg.event.time}</p>
                        </div>
                      </div>
                      {msg.event.location && (
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl py-2 px-4 flex items-center gap-2.5">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                          <p className="text-[13px] font-medium truncate">{msg.event.location}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/10">
                        <p className="text-[10px] opacity-60 font-medium">{new Date(msg.event.date).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] opacity-60 font-medium">{msg.event.time}</p>
                          <MessageStatus seen={msg.seen} />
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.call && (
                    <div className={`p-4 rounded-[1.5rem] shadow-lg border border-black/5 flex flex-col min-w-[220px] ${isSender ? "bg-[#dcfce7] text-gray-900" : "bg-white text-gray-900"}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${msg.call.status === "missed" ? "bg-red-100/50 text-red-500" : "bg-white text-slate-600"}`}>
                          {msg.call.type === "video" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.277 2.56 1.06v11.38c0 1.337-1.616 2.005-2.56 1.06Z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${msg.call.status === "missed" ? "-rotate-[135deg]" : ""}`}><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-[17px] text-slate-900 tracking-tight truncate">{msg.call.status === "missed" ? `Missed ${msg.call.type} call` : msg.call.type === "video" ? "Video call" : "Voice call"}</p>
                          <p className={`text-[16px] ${msg.call.status === "missed" ? "text-red-500" : "text-gray-500/80"} font-bold mt-0.5`}>{msg.call.status === "missed" ? "Missed" : msg.call.duration}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 items-center mt-1 -mb-1">
                        <p className="text-[11px] opacity-50 font-bold">{formatMessageTime(msg.createdAt)}</p>
                        {isSender && <MessageStatus seen={msg.seen} />}
                      </div>
                    </div>
                  )}
                  {!msg.call && (
                    <div className={`text-[10px] text-white/30 italic mt-1.5 flex items-center gap-1.5 px-1 ${isSender ? "justify-end" : "justify-start"}`}>
                      {formatMessageTime(msg.createdAt)}
                      {isSender && <MessageStatus seen={msg.seen} />}
                    </div>
                  )}

                  <div className={`absolute -top-3 ${isSender ? "-right-3" : "-left-3"} flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10`}>
                    {isSender && (
                      <button onClick={() => startEditing(msg)} className="p-1 p-1 bg-slate-800 rounded-full border border-white/10 text-white hover:bg-indigo-500 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.111 6h4.889" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => openDeleteModal(msg)} className="p-1 p-1 bg-slate-800 rounded-full border border-white/10 text-white hover:bg-red-500 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                {isSender && <img src={authUser.profilePic || assets.avatar_icon} className="w-7 h-7 rounded-full mb-1" alt="" />}
              </div>
            </React.Fragment>
          );
        }) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.303.025-.607.038-.913.039a48.142 48.142 0 0 1-3.013-.35l-3.337 2.177a.75.75 0 0 1-1.033-.13l-.531-.639a.75.75 0 0 1 .158-1.05l2.252-1.637a48.747 48.747 0 0 1-5.965-.548C4.113 14.805 3 13.518 3 12.029v-1.42c0-.97.616-1.813 1.5-2.098a48.577 48.577 0 0 1 15.75 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.123 18.123 9.742 16.5M12 10.5h.008v.008H12V10.5Z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">No Messages Yet</h3>
            <p className="text-xs font-bold leading-relaxed max-w-[200px]">Send a greeting to start your conversation with {selectedUser.fullName}</p>
          </div>
        )}
        {messages && messages.length > 0 && <div className="flex-1" />}
        <div ref={scrollEnd} />
      </div>

      {/* Input area */}
      <div className={`flex-none p-6 backdrop-blur-3xl z-20 transition-all duration-500 ${isDark ? 'bg-[#020617]/40 border-t border-white/5' : 'bg-white border-t border-slate-100 shadow-t-xl'}`}>
        {editingMessage && (
          <div className={`flex items-center justify-between p-3 border rounded-2xl mb-4 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> Editing Message</span>
            <button onClick={cancelEditing} className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-indigo-100'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
          </div>
        )}
        <div className="flex items-center gap-4 relative">
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-20 left-0 z-50">
              <EmojiPicker onEmojiClick={(e) => setInput(p => p + e.emoji)} theme={isDark ? "dark" : "light"} skinTonesDisabled searchDisabled />
            </div>
          )}
          <div className={`flex-1 flex items-center border rounded-[2rem] px-5 py-1.5 relative shadow-inner group transition-all focus-within:ring-2 ring-indigo-500/20 ${isDark ? 'bg-[#111827] border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between h-[48px] px-2 font-black uppercase tracking-widest text-xs">
                <span className="text-red-500 animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Recording {formatDuration(recordingDuration)}</span>
                <button onClick={stopRecording} className="text-indigo-400 hover:text-indigo-300">Finish</button>
              </div>
            ) : (
              <>
                <button ref={emojiButtonRef} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 transition-transform active:scale-90 ${showEmojiPicker ? 'text-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm3.65 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" /></svg>
                </button>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className={`flex-1 bg-transparent border-none outline-none px-3 py-3 text-[15px] placeholder-gray-600 ${isDark ? 'text-white' : 'text-slate-900'}`} />
                <div className="flex items-center gap-2 relative">
                  {showAttachmentMenu && (
                    <div ref={attachmentMenuRef} className={`absolute bottom-20 right-0 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-2 w-[240px] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200 ${isDark ? 'bg-[#1e293b]' : 'bg-white border border-slate-100'}`}>
                      {[
                        { label: 'Document', icon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>, color: 'bg-[#8B5CF6]', action: () => docInputRef.current.click() },
                        { label: 'Photos & videos', icon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>, color: 'bg-[#3B82F6]', action: () => imageInputRef.current.click() },
                        { label: 'Camera', icon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774/95 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>, color: 'bg-[#EC4899]', action: startCamera },
                        { label: 'Location', icon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>, color: 'bg-[#10B981]', action: handleSendLocation },
                        { label: 'Poll', icon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>, color: 'bg-[#F59E0B]', action: () => { if (input.trim()) setPollData(prev => ({ ...prev, question: input.trim() })); setShowPollModal(true); setShowAttachmentMenu(false); } },
                        { label: 'Event', icon: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>, color: 'bg-[#EF4444]', action: () => { setShowEventModal(true); setShowAttachmentMenu(false); } },
                        {
                          label: 'AI Assistant', icon: (props) => (
                            <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" />
                              <path d="M5 3v4" />
                              <path d="M19 17v4" />
                              <path d="M3 5h4" />
                              <path d="M17 19h4" />
                            </svg>
                          ), color: 'bg-gradient-to-tr from-indigo-500 to-purple-600', action: () => { setShowAIModal(true); setShowAttachmentMenu(false); }
                        },
                      ].map((item, idx) => (
                        <button key={idx} onClick={item.action} className={`flex items-center gap-4 p-3.5 transition-colors group/item rounded-2xl w-full text-left ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                          <div className={`w-10 h-10 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover/item:scale-110`}>
                            {item.icon({ className: "w-5 h-5" })}
                          </div>
                          <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button ref={attachmentButtonRef} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`p-2.5 rounded-full transition-all active:scale-95 ${showAttachmentMenu ? 'bg-indigo-600 text-white shadow-xl rotate-45' : (isDark ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600')}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32a1.5 1.5 0 1 1-2.121-2.121l10.94-10.94" /></svg>
                  </button>
                  <button onClick={startRecording} className={`p-2.5 transition-all active:scale-90 ${isDark ? 'text-gray-500 hover:text-indigo-500' : 'text-slate-400 hover:text-indigo-600'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg></button>
                </div>
              </>
            )}
          </div>
          <button onClick={handleSendMessage} className={`bg-gradient-to-tr from-indigo-500 to-purple-600 p-4 rounded-full text-white shadow-xl active:scale-90 transition-all group overflow-hidden relative ${isDark ? 'shadow-indigo-500/50' : 'shadow-indigo-500/30'}`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 -rotate-45 relative z-10"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
          </button>
        </div>
      </div>

      {/* Modals & Inputs */}
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*,video/*" onChange={handleSendImage} />
      <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleSendDocument} />

      {selectedImage && <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}><img src={selectedImage} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" /></div>}

      {showCameraModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full p-6 flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover bg-black rounded-2xl mb-6" />
            <div className="flex gap-6">
              <button onClick={capturePhoto} className="w-16 h-16 bg-white border-4 border-indigo-500 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all" />
              <button onClick={stopCamera} className="bg-red-500 text-white px-8 py-2 rounded-xl font-bold shadow-lg">Cancel</button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {showPollModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Create Poll</h3>
            <input value={pollData.question} onChange={e => setPollData({ ...pollData, question: e.target.value })} placeholder="Question" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none mb-4 focus:border-indigo-500 transition-colors" />
            <div className="flex flex-col gap-2 mb-6">
              {pollData.options.map((o, i) => (
                <input key={i} value={o} onChange={e => { const n = [...pollData.options]; n[i] = e.target.value; setPollData({ ...pollData, options: n }); }} placeholder={`Option ${i + 1}`} className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-white outline-none" />
              ))}
              <button onClick={() => setPollData({ ...pollData, options: [...pollData.options, ""] })} className="text-indigo-400 text-xs text-left">+ Add Option</button>
            </div>
            <button onClick={handleSendPoll} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-500">Send Poll</button>
            <button onClick={() => setShowPollModal(false)} className="w-full mt-4 text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">{editingMessage ? 'Edit Event' : 'Share Event'}</h3>
            <div className="flex flex-col gap-4">
              <input value={eventData.title} onChange={e => setEventData({ ...eventData, title: e.target.value })} placeholder="Title" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none" />
              <div className="flex gap-2">
                <input type="date" value={eventData.date} onChange={e => setEventData({ ...eventData, date: e.target.value })} className="flex-1 bg-white/5 border border-white/10 p-2.5 rounded-xl text-white outline-none" />
                <input type="time" value={eventData.time} onChange={e => setEventData({ ...eventData, time: e.target.value })} className="flex-1 bg-white/5 border border-white/10 p-2.5 rounded-xl text-white outline-none" />
              </div>
              <input value={eventData.location} onChange={e => setEventData({ ...eventData, location: e.target.value })} placeholder="Location" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none" />
              <button onClick={handleSendEvent} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-500">Send Event</button>
              <button onClick={() => setShowEventModal(false)} className="w-full text-gray-500 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl">
            <p className="text-white font-bold mb-4 text-center">Delete message?</p>
            <div className="flex flex-col gap-3">
              {deleteModal.isSender && <button onClick={() => handleDeleteConfirm("everyone")} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg">Delete for everyone</button>}
              <button onClick={() => handleDeleteConfirm("me")} className="w-full bg-white/5 text-white border border-white/10 py-3 rounded-xl font-bold">Delete for me</button>
              <button onClick={() => setDeleteModal({ show: false })} className="text-gray-500 py-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900/90 border border-white/10 p-0 rounded-[2.5rem] max-w-md w-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden shadow-indigo-500/10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">AI Assistant</h3>
              </div>
              <button onClick={closeAIModal} className="text-white/60 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              {/* Prompt Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Ask your question</label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="E.g. What is React.js?"
                  className="w-full bg-black/20 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-indigo-500/50 min-h-[120px] text-[15px] resize-none transition-all"
                />
                <button
                  disabled={isGenerating || !aiPrompt.trim()}
                  onClick={handleAIGenerate}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${isGenerating || !aiPrompt.trim() ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 active:scale-[0.98]'}`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : 'Ask AI'}
                </button>
              </div>

              {/* Result Preview */}
              {(isGenerating || aiResponse) && (
                <div className="mt-8 pt-8 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-green-400">
                      {isGenerating ? 'AI is thinking...' : 'AI Result Ready'}
                    </label>
                    {isGenerating && (
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                      </div>
                    )}
                  </div>

                  {aiResponse && (
                    <div className="bg-black/40 border border-white/10 p-6 rounded-3xl text-white/90 text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-inner shadow-black/40">
                      {aiResponse}
                    </div>
                  )}

                  {!isGenerating && aiResponse && (
                    <button
                      onClick={handleSendAIGenerated}
                      className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-green-400"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Send to Chat
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-4 text-gray-400 bg-white/5 border-l border-white/10 h-full max-md:hidden">
      <div className="p-6 bg-white/5 rounded-full shadow-[0_20px_50px_rgba(30,58,138,0.2)] border border-white/10 animate-bounce-slow">
        <img src={assets.logo_3d} className="max-w-28" alt="" />
      </div>
      <p className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Chat anytime, anywhere</p>
      <p className="text-sm font-light text-center">Select a chat to start messaging</p>
    </div>
  );
};

export default ChatContainer;
