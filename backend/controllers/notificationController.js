import Notification from "../models/Notification.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  console.log("User ID:", req.user?.id);  // Log user ID to ensure it's populated
  
  if (!req.user?.id) {
    return res.status(400).json({ message: "User not authenticated" });
  }
  
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    
    console.log("Notifications:", notifications);  // Log notifications to verify the result
    
    if (Array.isArray(notifications)) {
      res.json(notifications);  // If notifications are an array, return them
    } else {
      res.json([]);  // Fallback to empty array if something goes wrong
    }
    
  } catch (error) {
    console.error("Error fetching notifications:", error);  // Log the error in the catch block
    res.status(500).json({ message: "Server error" });
  }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all notifications as read for the logged-in user
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    res.status(200).json({ message: "All notifications marked as read", updatedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

