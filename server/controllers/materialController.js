const Material = require("../models/Material");

const escapeRegex = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc Get academic materials, filterable by class, section, category, subject
// @route GET /api/materials?class=&section=&category=&subject=
const getMaterials = async (req, res) => {
  try {
    let { class: cls, section, category, subject } = req.query;
    const filter = {};

    // Strict role enforcement for students
    if (req.user?.role === "student") {
      const studentClass = req.user.class || "10";
      const studentSection = req.user.section || "A";

      // Students can ONLY view materials for their own class or school-wide ("All Classes")
      filter.targetClass = { $in: [studentClass, "All Classes"] };
      filter.section = { $in: [studentSection, "All Sections"] };
    } else {
      // Admin and Teacher can filter by targetClass & section if provided
      if (cls && cls !== "All Classes") filter.targetClass = cls;
      if (section && section !== "All Sections") filter.section = section;
    }

    if (category && category !== "Choose Category..." && category !== "All Categories") {
      filter.category = category;
    }
    if (subject && subject.trim()) {
      filter.subject = new RegExp(escapeRegex(subject.trim()), "i");
    }

    const materials = await Material.find(filter)
      .populate("uploadedBy", "name role")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Upload/create a new academic material entry
// @route POST /api/materials
const createMaterial = async (req, res) => {
  try {
    const { title, targetClass, section, category, subject, link } = req.body;

    if (!title || !targetClass || !subject) {
      return res.status(400).json({ message: "Title, targetClass, and subject are required" });
    }

    // Validate link URL against malicious schemes (XSS prevention)
    if (link && link.trim()) {
      const cleanLink = link.trim();
      if (!/^https?:\/\//i.test(cleanLink)) {
        return res.status(400).json({ message: "Invalid resource link. Must start with http:// or https://" });
      }
    }

    const material = await Material.create({
      title: title.trim(),
      targetClass,
      section: section || "All Sections",
      category: category || "STUDY MATERIAL",
      subject: subject.trim(),
      link: (link || "").trim(),
      uploadedBy: req.user._id,
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a material (Admin or the uploader only)
// @route DELETE /api/materials/:id
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    // Authorization check
    if (req.user.role !== "admin" && material.uploadedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You can only remove your own uploaded materials" });
    }

    await material.deleteOne();
    res.json({ message: "Material removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMaterials, createMaterial, deleteMaterial };
