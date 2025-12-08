import axios from "axios";
import { ConfidentialClientApplication } from "@azure/msal-node";

/**
 * Create a Microsoft Teams Meeting
 * @param {string} organizerEmail - Email of the staff/organizer
 * @param {string} subject - Meeting subject
 * @param {string} startTime - ISO format start time
 * @param {string} endTime - ISO format end time
 */
export const adminCreateTeamsMeeting = async (req, res) => {
  const { organizerEmail, subject, startTime, endTime } = req.body;

  try {
    // Initialize MSAL client
    const msalConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    // Get Access Token
    const tokenResponse = await cca.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    const accessToken = tokenResponse.accessToken;

    // Create Online Meeting via Graph API
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${organizerEmail}/onlineMeetings`,
      {
        startDateTime: startTime,
        endDateTime: endTime,
        subject,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const joinUrl = response.data.joinWebUrl;

    // Send link back (or save to DB)
    res.json({
      message: "Microsoft Teams meeting created successfully",
      joinUrl,
    });
  } catch (error) {
    console.error("Error creating Teams meeting:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create Teams meeting",
      details: error.response?.data || error.message,
    });
  }
};
