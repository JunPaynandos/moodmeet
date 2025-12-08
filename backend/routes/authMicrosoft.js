import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import qs from "qs";

dotenv.config();
const router = express.Router();

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/auth/callback";

// 1️⃣ Step 1: Redirect user to Microsoft login
router.get("/login", (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=${encodeURIComponent(
    "User.Read OnlineMeetings.ReadWrite openid profile offline_access"
  )}`;

  res.redirect(authUrl);
});

// 2️⃣ Step 2: Microsoft redirects back with a "code"
router.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      qs.stringify({
        client_id: CLIENT_ID,
        scope: "User.Read OnlineMeetings.ReadWrite",
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // const { access_token } = tokenResponse.data;
    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    await User.findByIdAndUpdate(req.user._id, {
      msAccessToken: access_token,
      msRefreshToken: refresh_token,
      msTokenExpires: new Date(Date.now() + expires_in * 1000),
    });

    // Store this token in session or database (for counselor)
    res.json({ success: true, access_token });
  } catch (error) {
    console.error("Error exchanging code for token:", error.response?.data || error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
