import { useContext, useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { ThemeContext } from "../../context/ThemeContext";

const Sidebar = () => {
  const { theme, toggleTheme, isDark } = useContext(ThemeContext);
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [showBioEmojiPicker, setShowBioEmojiPicker] = useState(false);
  const bioEmojiRef = useRef();

  const { authUser, logout, onlineUsers, updateProfile } = useContext(AuthContext);

  const navigate = useNavigate();
  const dropdownRef = useRef();

  const filteredUsers = input
    ? users.filter((user) =>
      user.fullName.toLowerCase().includes(input.toLowerCase())
    )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  useEffect(() => {
    if (authUser) {
      setNewBio(authUser.bio || "");
    }
  }, [authUser]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    await updateProfile({
      bio: newBio,
      profilePic: newProfilePic === null ? authUser.profilePic : newProfilePic,
      fullName: authUser.fullName
    });
    setNewProfilePic(null);
    setShowEditModal(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (bioEmojiRef.current && !bioEmojiRef.current.contains(e.target)) {
        setShowBioEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown, showBioEmojiPicker]);

  return (
    <>
      <div
        className={`border-r backdrop-blur-xl h-full p-6 overflow-y-scroll custom-scrollbar flex flex-col transition-all duration-500 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/5 text-slate-900 shadow-inner"
          } ${selectedUser ? "max-md:hidden" : ""}`}
      >
        <div className="pb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <img src={assets.logo_3d} alt="logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${isDark
                  ? "bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10"
                  : "bg-black/5 border-black/5 text-indigo-600 hover:bg-black/10 shadow-sm"
                  }`}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`p-2 rounded-full transition-colors ${showDropdown ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')} ${isDark ? 'text-gray-400' : 'text-slate-600'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 border rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-black/5'}`}>
                    <button
                      onClick={() => { setShowEditModal(true); setShowDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-slate-700'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-60"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.111 6h4.889" /></svg>
                      Edit Profile
                    </button>
                    <button
                      onClick={() => { logout(); setShowDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left border-t ${isDark ? 'hover:bg-red-500/10 text-red-400 border-white/5' : 'hover:bg-red-50 text-red-600 border-black/5'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-60"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`focus-within:ring-2 ring-indigo-500/30 transition-all border rounded-2xl flex items-center gap-3 py-3.5 px-5 ${isDark ? 'bg-[#111827] border-white/5' : 'bg-black/5 border-black/5 shadow-inner'}`}>
            <img src={assets.search_icon} alt="Search" className="w-4 opacity-40" />
            <input
              onChange={(e) => setInput(e.target.value)}
              type="text"
              className={`bg-transparent border-none outline-none text-sm placeholder-gray-500 flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
              placeholder="Search User..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredUsers.map((user) => (
            <div
              onClick={() => setSelectedUser(user)}
              key={user._id}
              className={`relative flex items-center gap-4 p-4 rounded-[1.25rem] cursor-pointer transition-all duration-300 ${selectedUser?._id === user._id
                ? (isDark ? "bg-white/10 border-white/10 shadow-xl scale-[1.02]" : "bg-white border-black/5 shadow-md scale-[1.02] text-indigo-600")
                : (isDark ? "hover:bg-white/5 border-transparent" : "hover:bg-white border-transparent shadow-sm")
                }`}
            >
              <div className="relative">
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                />
                {onlineUsers.includes(user._id.toString()) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22c55e] border-2 border-[#1a1a1a] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <p className={`font-semibold truncate ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>{user.fullName}</p>
                <div className="flex items-center gap-1.5">
                  {onlineUsers.includes(user._id.toString()) ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[#22c55e] text-xs font-medium">Online</span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-xs">Offline</span>
                  )}
                </div>
              </div>
              {unseenMessages[user._id] && (
                <p className="h-6 min-w-[1.5rem] px-1 flex justify-center items-center rounded-lg bg-indigo-500 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20">
                  {unseenMessages[user._id]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && authUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-6">Edit Profile</h3>

              <div className="relative group cursor-pointer">
                <input type="file" onChange={handleProfilePicChange} className="hidden" id="profilePicInput" accept="image/*" />
                <label htmlFor="profilePicInput" className="cursor-pointer block relative">
                  <img
                    src={newProfilePic === "" ? assets.avatar_icon : (newProfilePic || authUser.profilePic || assets.avatar_icon)}
                    className="w-24 h-24 rounded-[2rem] object-cover border-4 border-indigo-500/20 shadow-xl transition-all group-hover:scale-105"
                    alt="Avatar"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="m6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774/95 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                  </div>
                </label>
                {(newProfilePic || authUser.profilePic) && (
                  <button
                    onClick={() => setNewProfilePic("")}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl border-2 border-[#0f172a] transition-all hover:scale-110 active:scale-95 z-20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
                )}
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4">{newProfilePic === "" ? "Photo will be removed" : "Tap to change avatar"}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1 block mb-2">Full Name</label>
                <input
                  disabled
                  value={authUser.fullName}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none cursor-not-allowed opacity-50 text-sm font-bold"
                />
              </div>
              <div>
                <div className="flex items-center justify-between ml-1 mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Your Bio</label>
                  <div className="relative" ref={bioEmojiRef}>
                    <button
                      onClick={() => setShowBioEmojiPicker(!showBioEmojiPicker)}
                      className={`p-1.5 rounded-full transition-all active:scale-90 ${showBioEmojiPicker ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm3.65 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" /></svg>
                    </button>
                    {showBioEmojiPicker && (
                      <div className="absolute bottom-10 right-0 z-[210]">
                        <EmojiPicker
                          onEmojiClick={(e) => setNewBio(p => p + e.emoji)}
                          theme="dark"
                          skinTonesDisabled
                          searchDisabled
                          width={280}
                          height={350}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows="3"
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-indigo-500 transition-colors text-sm font-medium resize-none shadow-inner"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
