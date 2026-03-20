import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");

  const { login, verifyOTP } = useContext(AuthContext);
  const { toggleTheme, isDark } = useContext(ThemeContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (showOTP) {
      await verifyOTP(email, otp);
      return;
    }

    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
    const res = await login(currState === "Sign up" ? "signup" : "login", {
      fullName,
      email,
      password,
      bio,
    });

    if (res?.needsVerification) {
      setShowOTP(true);
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center gap-10 sm:justify-evenly max-sm:flex-col sm:p-5 md:p-10 lg:p-[5%] relative transition-all duration-500 ${isDark ? '' : 'bg-transparent'}`}>

      {/* Theme Toggle for Login Page */}
      <button
        onClick={toggleTheme}
        className={`fixed top-8 right-8 p-3 rounded-2xl border transition-all active:scale-95 shadow-xl backdrop-blur-xl z-[100] ${isDark
          ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10"
          : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50"
          }`}
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

      {/* ------- left -------*/}
      <img src={assets.logo_3d} alt="logo" className={`w-[min(300vw,250px)] drop-shadow-[0_10px_30px_rgba(99,102,241,0.8)] px-4 transition-all duration-500 ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply opacity-80'}`} />

      {/* ------- Right -------*/}
      <form
        onSubmit={onSubmitHandler}
        className={`backdrop-blur-xl border p-6 w-[90%] sm:w-[360px] flex flex-col gap-5 rounded-[2rem] z-10 transition-all duration-500 shadow-2xl ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
      >
        <h2 className="font-bold text-2xl flex justify-between items-center tracking-tight">
          {showOTP ? "Verify Email" : currState}
          {(isDataSubmitted || showOTP) && (
            <img
              onClick={() => {
                if (showOTP) {
                  setShowOTP(false);
                } else {
                  setIsDataSubmitted(false);
                }
              }}
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
            />
          )}
        </h2>

        {showOTP ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-400">Please enter the 6-digit code sent to <b>{email}</b></p>
            <input
              onChange={(e) => setOtp(e.target.value)}
              value={otp}
              type="text"
              maxLength={6}
              className={`p-3.5 border rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-center text-2xl font-bold tracking-[0.5em] ${isDark ? 'bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder-gray-400' : 'bg-slate-50 border-slate-200 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'}`}
              placeholder="000000"
              required
            />
          </div>
        ) : (
          <>
            {currState === "Sign up" && !isDataSubmitted && (
              <input
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
                type="text"
                className={`p-3.5 border rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm ${isDark ? 'bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder-gray-400' : 'bg-slate-50 border-slate-200 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'}`}
                placeholder="Full Name"
                required
              />
            )}

            {!isDataSubmitted && (
              <>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  placeholder="Email Address"
                  required
                  className={`p-3.5 border rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm ${isDark ? 'bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder-gray-400' : 'bg-slate-50 border-slate-200 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'}`}
                />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type="password"
                  placeholder="Password"
                  required
                  className={`p-3.5 border rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm ${isDark ? 'bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder-gray-400' : 'bg-slate-50 border-slate-200 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'}`}
                />
              </>
            )}

            {currState === "Sign up" && isDataSubmitted && (
              <textarea
                onChange={(e) => setBio(e.target.value)}
                value={bio}
                rows={4}
                className={`p-3.5 border rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm resize-none ${isDark ? 'bg-black/20 border-white/10 focus:bg-black/40 text-white placeholder-gray-400' : 'bg-slate-50 border-slate-200 focus:bg-white text-slate-900 placeholder-slate-400 shadow-inner'}`}
                placeholder="Provide a short bio..."
                required
              ></textarea>
            )}
          </>
        )}

        <button
          type="submit"
          className="py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl cursor-pointer font-medium shadow-lg hover:shadow-indigo-500/40 transition-all mt-2"
        >
          {showOTP ? "Verify OTP" : currState === "Sign up" ? (isDataSubmitted ? "Finish Sign Up" : "Next") : "Login Now"}
        </button>

        {currState === "Sign up" && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <input type="checkbox" required className="accent-indigo-500" />
            <p>Agree to the terms of use & privacy policy</p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4 text-center">
          {currState === "Sign up" ? (
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Create an account{" "}
              <span
                onClick={() => setCurrState("Sign up")}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>

      {/* Footer Part */}
      <footer className="absolute bottom-6 w-full text-center flex flex-col items-center gap-1.5 transition-all duration-500 pb-2">
        <p className={`text-sm font-bold tracking-tight ${isDark ? 'text-white/40' : 'text-slate-400'}`}>©2026 QuickChat, All CopyRight Reserved <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black">(❤️ By Raushan Yadav).</span></p>
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border backdrop-blur-md transition-all ${isDark ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-slate-50 border-slate-200 text-indigo-600 shadow-sm'}`}>
          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          <span className="text-[12px] font-black tracking-widest uppercase">Nawada, Bihar - 805127</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
