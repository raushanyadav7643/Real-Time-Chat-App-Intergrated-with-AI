import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/User.js";
import { sendOTP } from "../lib/nodemailer.js";

// Signup a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let newUser;
    if (user && !user.isVerified) {
      // Update existing unverified user
      newUser = await User.findOneAndUpdate(
        { email },
        { fullName, password: hashedPassword, bio, otp, otpExpiry },
        { new: true }
      );
    } else {
      newUser = await User.create({
        fullName,
        email,
        password: hashedPassword,
        bio,
        otp,
        otpExpiry
      });
    }

    const sent = await sendOTP(email, otp);
    if (!sent) return res.json({ success: false, message: "Error sending email" });

    res.json({
      success: true,
      message: "OTP sent to your email",
      needsVerification: true
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpiry = null;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, userData: user, token, message: "Verification successful" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Controller to login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Always send OTP for 2FA on every login attempt as requested
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    userData.otp = otp;
    userData.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await userData.save();
    
    await sendOTP(email, otp);
    return res.json({ 
      success: true, 
      message: "Security code sent to your email", 
      needsVerification: true 
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    const currentProfilePic = req.user.profilePic;
    let uploadResponse = null;

    // Only upload to Cloudinary if it's a new base64 image (starts with 'data:image')
    if (profilePic && profilePic.startsWith('data:image')) {
      uploadResponse = await cloudinary.uploader.upload(profilePic);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePic: uploadResponse ? uploadResponse.secure_url : profilePic, 
        bio, 
        fullName: fullName || req.user.fullName 
      },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log("Update profile error:", error);
    res.json({ success: false, message: error.message });
  }
};
