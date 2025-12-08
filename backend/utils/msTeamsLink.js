import axios from "axios";

export async function createTeamsMeeting({ subject, startTime, endTime, userAccessToken }) {
  try {
    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/onlineMeetings",
      {
        startDateTime: startTime,
        endDateTime: endTime,
        subject,
      },
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Teams meeting created successfully (delegated)");
    return response.data.joinWebUrl;
  } catch (error) {
    console.error("Graph API error:", error.response?.data || error.message);
    throw new Error("Failed to create Microsoft Teams meeting");
  }
}
