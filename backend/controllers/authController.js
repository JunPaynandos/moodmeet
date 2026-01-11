// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const loginUser = async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (user && (await user.matchPassword(password))) {
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "30d",
//     });
//     res.json({ _id: user._id, name: user.name, email: user.email, token });res.json({
//       _id: user._id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       role: user.role,
//       token,
//     });
//   } else {
//     res.status(401).json({ message: "Invalid email or password" });
//   }
// };


import jwt from "jsonwebtoken";
import User from "../models/User.js";
import axios from "axios";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js"
import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
};

const pca = new ConfidentialClientApplication(msalConfig);

const redirectUri = "https://moodmeet.onrender.com/auth/microsoft/callback";

/**
 * Normal login (students)
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Microsoft login redirect (for admins & counselors)
 */
export const microsoftLoginRedirect = async (req, res) => {
  const authCodeUrlParameters = {
    scopes: ["User.Read", "OnlineMeetings.ReadWrite"],
    redirectUri,
  };

  const url = await pca.getAuthCodeUrl(authCodeUrlParameters);
  res.redirect(url);
};

/**
 * Microsoft login callback (after successful Microsoft login)
 */
export const microsoftLoginCallback = async (req, res) => {
  try {
    const tokenResponse = await pca.acquireTokenByCode({
      code: req.query.code,
      scopes: ["User.Read", "OnlineMeetings.ReadWrite", "offline_access"],
      redirectUri,
    });

    const accessToken = tokenResponse.accessToken;
    const refreshToken = tokenResponse.refreshToken;
    const expiresOn = tokenResponse.expiresOn;

    // Get Microsoft user info
    const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { mail, userPrincipalName } = graphResponse.data;
    const email = mail || userPrincipalName;

    if (!email)
      return res.status(400).json({ message: "No email returned from Microsoft" });

    // Find the user in DB
    const user = await User.findOne({ email });
    if (!user || !["counselor", "admin"].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied. Only authorized Microsoft accounts (admin/counselor) are allowed.",
      });
    }

    // 🔹 Save delegated Microsoft token for later Graph API calls
    user.msAccessToken = accessToken;
    user.msRefreshToken = refreshToken;
    user.msTokenExpires = expiresOn;
    await user.save();

    // Create your local JWT (for your own session)
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Redirect back to frontend
    const redirectURL = `https://moodmeet.vercel.app/login-success?token=${jwtToken}&email=${encodeURIComponent(
      email
    )}&role=${user.role}`;
    res.redirect(redirectURL);
  } catch (error) {
    console.error("Microsoft login failed:", error.message);
    console.error(error.response?.data || error);
    res.redirect("https://moodmeet.vercel.app/login-failed");
  }
};

// 1️⃣ Forgot Password
// export const forgotPassword = async (req, res) => {
//   const { email } = req.body;
  
//   try {
//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(404).json({ message: "Email not found" });

//     // Create reset token
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
//     await user.save();

//     const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

//     await sendEmail({
//       to: email,
//       subject: "Password Reset",
//       html: `
//         <h2>Password Reset Link</h2>
//         <p>Click the link below to reset your password:</p>
//         <a href="${resetURL}">${resetURL}</a>
//         <p>This link is valid for 15 minutes.</p>
//       `,
//     });

//     res.json({ message: "Reset link sent to your email!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Email not found" });

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    // Use .env or fallback
    const CLIENT_URL = process.env.CLIENT_URL || "https://moodmeet.vercel.app";
    const resetURL = `${CLIENT_URL}/reset-password/${resetToken}`;

    // Styled HTML email
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <div style="padding: 25px 30px;">
            <h2 style="color: #333;">Reset Your Password</h2>

            <p style="font-size: 15px; color: #555;">
              Hello <strong>${user.firstName}</strong>,
            </p>

            <p style="font-size: 15px; color: #555;">
              You recently requested to reset your password for your MoodMeet account.
            </p>

            <div style="margin: 20px 0; background-color: #f8f9fa; border-left: 4px solid #00796B; padding: 15px;">
              <p style="font-size: 15px;">
                Click the button below to reset your password:
              </p>

              <div style="text-align: center; margin-top: 15px;">
                <a href="${resetURL}" 
                  style="display: inline-block; background-color: #00796B; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
            </div>

            <p style="font-size: 15px; color: #555;">
              Or copy and paste the link below into your browser:
            </p>

            <p style="word-break: break-all; color: #00796B;">
              ${resetURL}
            </p>

            <p style="font-size: 14px; color: #777; margin-top: 20px;">
              This link will expire in <strong>15 minutes</strong>.
            </p>

            <p style="font-size: 13px; color: #777; margin-top: 30px; text-align: center;">
              If you did not request this, you can safely ignore this email.
            </p>
          </div>

          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; color: #555; font-size: 13px;">
            © ${new Date().getFullYear()} MoodMeet — All rights reserved.
          </div>

        </div>
      </div>
    `;

    // Send email (3rd param is HTML)
    await sendEmail(email, "Password Reset Request", html);

    res.json({ message: "Reset link sent to your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// 2️⃣ Reset Password
// export const resetPassword = async (req, res) => {
//   try {
//     const { password } = req.body;
//     const { token } = req.params;

//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user)
//       return res.status(400).json({ message: "Invalid or expired token" });

//     user.password = password; // hashing happens in user model middleware
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     res.json({ message: "Password reset successful! You may now login." });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // 🔐 Hash password manually here
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful! You may now login." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
