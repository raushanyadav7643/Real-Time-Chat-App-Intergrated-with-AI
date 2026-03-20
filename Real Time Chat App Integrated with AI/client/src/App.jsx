import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import CallScreen from "./components/CallScreen";

import { ThemeContext } from "../context/ThemeContext";

const App = () => {
  const { authUser } = useContext(AuthContext);
  const { theme, isDark } = useContext(ThemeContext);

  return (
    <div className={`h-screen w-full relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Decorative gradient orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-all duration-700 ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-400/10'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-all duration-700 ${isDark ? 'bg-purple-600/15' : 'bg-purple-400/10'}`}></div>

      <div className={`relative z-10 h-screen w-full flex flex-col overflow-hidden sticky top-0 transition-all duration-500 ${isDark ? 'bg-gradient-to-br from-gray-900 via-slate-950 to-black' : 'bg-gradient-to-br from-white via-indigo-50/30 to-slate-100'}`}>
        <Toaster />
        <CallScreen />
        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={authUser ? <HomePage /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={!authUser ? <LoginPage /> : <Navigate to="/" />}
            />
            <Route
              path="/profile"
              element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
