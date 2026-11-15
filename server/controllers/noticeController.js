const Notice = require("../models/Notice");

// @desc Get all notices, optional category filter and role-scoped audience filter
// @route GET /api/notices?category=
const getNotices = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== "All Notice Categories") {
      filter.category = category;
    }

    // Role-based audience filtering
    const role = req.user?.role;
    if (role === "student") {
      filter.audience = { $in: ["EVERYONE", "STUDENT"] };
    } else if (role === "teacher") {
      // Teachers can see institutional/faculty notices AND any notices they authored for students
      filter.$or = [
        { audience: { $in: ["EVERYONE", "TEACHER"] } },
        { publishedBy: req.user._id },
      ];
    }
    // Admin sees all notices

    const notices = await Notice.find(filter)
      .populate("publishedBy", "name role")
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid notice identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Post a new announcement
// @route POST /api/notices
const createNotice = async (req, res) => {
  try {
    const { title, content, category, audience } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }
    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: category || "General",
      audience: audience || "EVERYONE",
      publishedBy: req.user._id,
    });
    res.status(201).json(notice);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid notice identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a notice
// @route DELETE /api/notices/:id
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // Authorization: Admin or author
    if (req.user.role !== "admin" && notice.publishedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You can only remove your own notices" });
    }

    await notice.deleteOne();
    res.json({ message: "Notice removed" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid notice identifier format" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotices, createNotice, deleteNotice };
