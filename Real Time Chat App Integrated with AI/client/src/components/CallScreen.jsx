import { useContext, useEffect, useRef } from "react";
import { CallContext } from "../../context/CallContext";
import assets from "../assets/assets";

const CallScreen = () => {
  const {
    incomingCall,
    onCall,
    acceptCall,
    rejectCall,
    endCall,
    callStatus,
    callType,
    remoteStream,
    localStream,
    callPartner,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
  } = useContext(CallContext);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!incomingCall && !onCall) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {incomingCall && !onCall ? (
        /* Incoming Call UI */
        <div className="bg-slate-900/90 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center animate-pulse">
          <img
            src={incomingCall.fromPic || assets.avatar_icon}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-500"
            alt=""
          />
          <h2 className="text-2xl font-bold text-white mb-1">
            {incomingCall.fromName}
          </h2>
          <p className="text-gray-400 mb-8 capitalize">
            {incomingCall.type} call ringing...
          </p>
          <div className="flex justify-center gap-6">
            <button
              onClick={acceptCall}
              className="p-4 bg-green-500 rounded-full hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </button>
            <button
              onClick={rejectCall}
              className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Active Call UI */
        <div className="w-full h-full flex flex-col relative overflow-hidden">
          {callType === "video" ? (
            <div className="flex-1 relative bg-black">
              {/* Remote Video */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={callPartner?.profilePic || assets.avatar_icon}
                    className="w-32 h-32 rounded-full mb-4 border-2 border-white/20"
                    alt=""
                  />
                  <p className="text-white text-xl animate-pulse">
                    {callStatus === "calling" ? "Ringing..." : "Connecting video..."}
                  </p>
                </div>
              )}

              {/* Local Video (Floating) */}
              <div className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black/40 backdrop-blur-sm">
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white/50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Voice Call UI */
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900">
              <audio ref={remoteVideoRef} autoPlay playsInline className="hidden" />
              <div className="relative">
                <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-indigo-500 rounded-full animate-ping opacity-10"></div>
                <div className="absolute inset-x-[-40px] inset-y-[-40px] bg-indigo-500 rounded-full animate-ping opacity-5 delay-300"></div>
                <img
                  src={callPartner?.profilePic || assets.avatar_icon}
                  className="w-40 h-40 rounded-full relative z-10 border-4 border-slate-800 shadow-2xl object-cover"
                  alt=""
                />
              </div>
              <h2 className="text-3xl font-bold text-white mt-12 mb-2">
                {callPartner?.fullName}
              </h2>
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                <p className="font-medium tracking-widest uppercase text-sm">
                  {callStatus === "calling" ? "Ringing..." : "Voice Call Active"}
                </p>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
              </div>
            </div>
          )}

          {/* Call Controls Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-[210]">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.5a2.25 2.25 0 0 1-2.25-2.25V9.75a2.25 2.25 0 0 1 2.25-2.25h2.25Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.5a2.25 2.25 0 0 1-2.25-2.25V9.75a2.25 2.25 0 0 1 2.25-2.25h2.25Z" />
                </svg>
              )}
            </button>

            {callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all ${
                  isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isVideoOff ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9a2.25 2.25 0 0 1 2.25-2.25h3m-3 3 12 12m0-12v-3m0 0h-3m3 3L3 3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                )}
              </button>
            )}

            <button
              onClick={endCall}
              className="p-5 bg-red-600 rounded-full hover:bg-red-700 hover:scale-110 transition-all shadow-xl shadow-red-600/30"
              title="End Call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-white rotate-[135deg]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;
