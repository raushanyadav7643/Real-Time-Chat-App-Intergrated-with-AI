import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"ChatApp Verification" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Your Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', serif; text-align: center; padding: 40px; border-radius: 20px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; margin: 20px auto; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <div style="background: rgba(255,255,255,0.1); border: 1px border; backdrop-blur: 10px; padding: 30px; border-radius: 20px;">
          <h1 style="margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -1px;">Verify Identity</h1>
          <p style="opacity: 0.8; font-size: 14px;">Use the code below to complete your login</p>
          <div style="font-size: 42px; font-weight: 900; background: white; color: #6366f1; padding: 15px; border-radius: 15px; margin: 20px 0; letter-spacing: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);">${otp}</div>
          <p style="font-size: 11px; opacity: 0.6;">This code is valid for 10 minutes. Please do not share this with anyone.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Sent Successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("CRITICAL: EMAIL SENDING FAILED");
    console.error("Reason:", error.message);
    if (error.response) console.error("SMTP Response:", error.response);
    return false;
  }
};
