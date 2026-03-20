import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate("/");
    };
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-5 md:p-10 relative">
      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white flex items-center justify-between max-sm:flex-col-reverse rounded-3xl overflow-hidden">
        {/* Form Section */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 p-10 flex-1 w-full"
        >
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Profile Details</h2>
          </div>

          {/* Profile Image Upload */}
          <label
            htmlFor="avatar"
            className="flex items-center gap-4 cursor-pointer group p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-black/40 hover:border-indigo-500/30 transition-all"
          >
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : assets.avatar_icon
              }
              alt="profile"
              className={`w-14 h-14 object-cover ${selectedImg ? "rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" : ""}`}
            />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Upload Profile Image</span>
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 text-white placeholder-gray-400 transition-all text-sm"
            placeholder="Enter your name"
          />

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="p-3.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 text-white placeholder-gray-400 transition-all text-sm resize-none"
            placeholder="Enter profile bio"
          />

          <button
            type="submit"
            className="mt-2 py-3.5 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium rounded-xl text-md cursor-pointer shadow-lg hover:shadow-indigo-500/40 transition-all"
          >
            Save Changes
          </button>
        </form>
        <div className="flex-1 flex justify-center items-center p-10 max-sm:pb-0 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-[60px]"></div>
          <img
            className={`w-48 h-48 sm:w-64 sm:h-64 object-cover border-4 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 ${selectedImg ? "rounded-full" : "rounded-3xl"
              }`}
            src={authUser?.profilePic || assets.logo_icon}
            alt="Current Profile"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
