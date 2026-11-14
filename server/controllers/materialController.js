const Material = require("../models/Material");

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
      filter.subject = new RegExp(subject.trim(), "i");
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
    const material = await Material.create({ ...req.body, uploadedBy: req.user._id });
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete a material
// @route DELETE /api/materials/:id
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    res.json({ message: "Material removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMaterials, createMaterial, deleteMaterial };
