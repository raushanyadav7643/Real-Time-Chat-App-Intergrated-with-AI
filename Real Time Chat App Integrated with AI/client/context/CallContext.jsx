import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { ChatContext } from "./ChatContext";
import toast from "react-hot-toast";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket, authUser, axios } = useContext(AuthContext);
  const { sendMessage } = useContext(ChatContext);
  const [incomingCall, setIncomingCall] = useState(null);
  const [onCall, setOnCall] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // 'calling', 'ringing', 'connected'
  const [callType, setCallType] = useState(null); // 'voice' or 'video'
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callPartner, setCallPartner] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);

  const callingAudio = useRef(null);
  const ringingAudio = useRef(null);

  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const callStartTime = useRef(null);
  const callStatusRef = useRef(null);
  const callPartnerRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const callTypeRef = useRef(null);

  const servers = {
    iceServers: [
      { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    ],
  };

  useEffect(() => {
    // Reverting to original audio sources
    callingAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    ringingAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3");
    
    callingAudio.current.loop = true;
    ringingAudio.current.loop = true;

    // Helper to unlock audio for browser policies
    const unlockAudio = () => {
      console.log("Unlocking audio for autoplay policy...");
      callingAudio.current.play().then(() => {
        callingAudio.current.pause();
        callingAudio.current.currentTime = 0;
      }).catch(() => {});
      
      ringingAudio.current.play().then(() => {
        ringingAudio.current.pause();
        ringingAudio.current.currentTime = 0;
      }).catch(() => {});
      
      window.removeEventListener("mousedown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("mousedown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio);

    return () => {
      stopAllSounds();
      window.removeEventListener("mousedown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const playCallingSound = () => {
    console.log("Playing calling sound...");
    stopAllSounds();
    if (callingAudio.current) {
      callingAudio.current.currentTime = 0;
      callingAudio.current.play().catch(e => {
        console.error("Calling audio play failed:", e);
        toast.error("Click anywhere to enable call sounds", { id: 'audio-permission' });
      });
    }
  };

  const playRingingSound = () => {
    console.log("Playing ringing sound...");
    stopAllSounds();
    if (ringingAudio.current) {
      ringingAudio.current.currentTime = 0;
      ringingAudio.current.play().catch(e => {
        console.error("Ringing audio play failed:", e);
        toast.error("Click anywhere to enable call sounds", { id: 'audio-permission' });
      });
    }
  };

  const stopAllSounds = () => {
    if (callingAudio.current) {
      callingAudio.current.pause();
      callingAudio.current.currentTime = 0;
    }
    if (ringingAudio.current) {
      ringingAudio.current.pause();
      ringingAudio.current.currentTime = 0;
    }
  };

  const startCall = async (user, type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallType(type);
      callTypeRef.current = type;
      setCallPartner(user);
      callPartnerRef.current = user;
      setIsInitiator(true);
      isInitiatorRef.current = true;
      setOnCall(true);
      setCallStatus("calling");
      callStatusRef.current = "calling";
      playCallingSound();

      const pc = new RTCPeerConnection(servers);
      peerConnection.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { to: user._id.toString(), candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", {
        to: user._id.toString(),
        offer,
        type,
        fromName: authUser.fullName,
        fromPic: authUser.profilePic,
      });

      // Server will now handle the 30s timeout and emit 'call-ended'
    } catch (error) {
      toast.error("Could not start call: " + error.message);
      endCall();
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === "video",
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallType(incomingCall.type);
      callTypeRef.current = incomingCall.type;
      const partner = { _id: incomingCall.from, fullName: incomingCall.fromName, profilePic: incomingCall.fromPic };
      setCallPartner(partner);
      callPartnerRef.current = partner;
      setOnCall(true);
      setCallStatus("connected");
      callStatusRef.current = "connected";
      callStartTime.current = Date.now();
      stopAllSounds();

      const pc = new RTCPeerConnection(servers);
      peerConnection.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { to: incomingCall.from.toString(), candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer-call", { to: incomingCall.from.toString(), answer });
      setIncomingCall(null);
    } catch (error) {
      toast.error("Could not accept call: " + error.message);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("end-call", { to: incomingCall.from.toString(), reason: "reject" });
    }
    endCallLocally();
  };

  const endCall = () => {
    let partnerId;
    if (onCall && callPartner) {
      partnerId = callPartner._id;
    } else if (incomingCall) {
      partnerId = incomingCall.from;
    } else if (callPartner) {
      partnerId = callPartner._id;
    }

    if (partnerId) {
      socket.emit("end-call", { to: partnerId.toString(), reason: "cancel" });
    }
    endCallLocally();
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (data) => {
      console.log("Incoming call receiving in CallContext:", data);
      
      // Auto-dismiss after 29 seconds if not answered (fail-safe)
      const receiverTimeout = setTimeout(() => {
        console.log("Receiver-side timeout: Call not answered in 29s");
        endCallLocally();
      }, 29000); // 29s (slightly more than caller to allow server signal first)

      toast.success(`Incoming ${data.type} call from ${data.fromName}`, { 
        id: "call-toast",
        duration: 30000 
      });

      setIncomingCall({ ...data, receiverTimeout });
      setIsInitiator(false);
      isInitiatorRef.current = false;
      setCallStatus("ringing");
      callStatusRef.current = "ringing";
      playRingingSound();
    });

    socket.on("call-error", ({ message }) => {
      toast.error(message);
      endCallLocally();
    });

    socket.on("call-answered", async ({ answer }) => {
      console.log("Call answered signal received");
      setCallStatus("connected");
      callStatusRef.current = "connected";
      callStartTime.current = Date.now();
      stopAllSounds();
      // Clear caller-side ringing timeout
      if (peerConnection.current?.ringingTimeout) {
        clearTimeout(peerConnection.current.ringingTimeout);
      }
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on("call-ended", () => {
      console.log("Call ended signal received from server");
      stopAllSounds();
      endCallLocally();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket]);

  const endCallLocally = () => {
    console.log("Cleaning up call states locally...");
    
    // If we were in a connected call, log the duration
    // Only the initiator (caller) logs the duration to avoid duplicates
    if (callStatusRef.current === "connected" && callStartTime.current && callPartnerRef.current && isInitiatorRef.current) {
      const durationMs = Date.now() - callStartTime.current;
      const durationSec = Math.floor(durationMs / 1000);
      
      const formatDurationText = (seconds) => {
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      };

      const durationText = formatDurationText(durationSec);
      
      // Send structured call data
      const partnerId = callPartnerRef.current._id;
      sendMessage({ 
        call: {
          type: callTypeRef.current,
          status: "connected",
          duration: durationText
        }
      }, partnerId);
    }

    toast.dismiss("call-toast");
    stopAllSounds();
    
    // Clear any pending timeouts
    if (incomingCall?.receiverTimeout) {
      clearTimeout(incomingCall.receiverTimeout);
    }

    if (peerConnection.current) {
      if (peerConnection.current.ringingTimeout) {
        clearTimeout(peerConnection.current.ringingTimeout);
      }
      try {
        peerConnection.current.close();
      } catch (e) {}
      peerConnection.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setOnCall(false);
    setCallPartner(null);
    callPartnerRef.current = null;
    setCallType(null);
    callTypeRef.current = null;
    setIncomingCall(null);
    setCallStatus(null);
    callStatusRef.current = null;
    setIsInitiator(false);
    isInitiatorRef.current = false;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === "video") {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  const value = {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    onCall,
    callStatus,
    callType,
    remoteStream,
    localStream,
    callPartner,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
