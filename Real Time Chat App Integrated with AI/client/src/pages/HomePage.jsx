import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../../context/ChatContext";
import { ThemeContext } from "../../context/ThemeContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);
  const { isDark } = useContext(ThemeContext);

  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <div
        className={`backdrop-blur-3xl border rounded-[2.5rem] overflow-hidden w-[95%] h-[89vh] max-w-[1500px] max-h-[850px] grid grid-cols-1 md:grid-cols-[300px_1fr_290px] relative items-stretch transition-all duration-500 ${isDark
          ? "bg-white/5 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          : "bg-white/90 border-slate-200 shadow-2xl"
          }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;
