import Announcement from "../models/Announcement.js";

// Get all announcements (students)
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new announcement (counselor)
export const createAnnouncement = async (req, res) => {
  try {
    const announcement = new Announcement({
      ...req.body,
      createdBy: req.user.id,
    });
    await announcement.save();

    // Optional: emit via socket for real-time updates
    if (req.io) req.io.emit("new-announcement", announcement);

    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update an announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    // Only the creator can update (optional)
    if (announcement.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update fields
    announcement.title = req.body.title || announcement.title;
    announcement.content = req.body.content || announcement.content;

    await announcement.save();

    // Emit real-time update
    if (req.io) req.io.emit("new-announcement", announcement);

    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
