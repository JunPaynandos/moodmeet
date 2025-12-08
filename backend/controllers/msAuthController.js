// import axios from "axios";

// export const microsoftAuthCallback = async (req, res) => {
//   const code = req.query.code;

//   try {
//     const tokenResponse = await axios.post(
//       `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
//       new URLSearchParams({
//         client_id: process.env.AZURE_CLIENT_ID,
//         client_secret: process.env.AZURE_CLIENT_SECRET,
//         code,
//         grant_type: "authorization_code",
//         redirect_uri: "http://localhost:5000/auth/callback",
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const accessToken = tokenResponse.data.access_token;

//     res.json({
//       message: "Connected to Microsoft successfully",
//       accessToken,
//     });
//   } catch (err) {
//     console.error("Microsoft Auth Error:", err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to authenticate with Microsoft" });
//   }
// };

import User from "../models/User.js";

export const microsoftAuthCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.AZURE_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;

    // 🔥 IMPORTANT: Save token for logged-in counselor
    const userId = req.user?._id; // you must protect this route with `protect`

    if (!userId) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    await User.findByIdAndUpdate(userId, {
      msAccessToken: accessToken,
    });

    res.json({
      message: "Connected to Microsoft successfully",
      accessToken,
    });
  } catch (err) {
    console.error("Microsoft Auth Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to authenticate with Microsoft" });
  }
};

