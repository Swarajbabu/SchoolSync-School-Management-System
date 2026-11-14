const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @desc Register a new user (Public registration is strictly student; admin can specify role)
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, rollNo, class: cls, section } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Public signup is strictly forced to role: "student".
    // Staff/Admin accounts can only be created via the admin-protected /api/staff endpoint.
    let assignedRole = "student";
    if (req.user && req.user.role === "admin" && req.body.role) {
      assignedRole = req.body.role;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      rollNo: rollNo ? rollNo.toString().trim() : "",
      class: cls || "10",
      section: section || "A",
      status: "Active",
      accessProtocol:
        assignedRole === "admin"
          ? "ADMIN_SECURE_V1"
          : assignedRole === "teacher"
          ? "TEACHER_SECURE_V1"
          : "STUDENT_SECURE_V1",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login with roll number/email + password (role aware for Student vs Staff/Admin tab)
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password, loginType } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    const cleanIdentifier = identifier.toString().trim();
    const isEmail = cleanIdentifier.includes("@");

    let query;
    if (isEmail) {
      query = { email: cleanIdentifier.toLowerCase() };
    } else {
      // If logging in by roll number, must be in student role
      query = { rollNo: cleanIdentifier, role: "student" };
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check account status
    if (user.status && user.status.toLowerCase() === "inactive") {
      return res.status(403).json({ message: "Account is inactive. Please contact administration." });
    }

    if (loginType === "student" && user.role !== "student") {
      return res.status(403).json({ message: "Please use Staff/Admin login tab" });
    }
    if (loginType === "staff" && user.role === "student") {
      return res.status(403).json({ message: "Please use Student login tab" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      class: user.class,
      section: user.section,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get current logged-in user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc Update own profile (strictly whitelisted fields only)
// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    // Whitelist only safe demographic & profile presentation fields.
    // Class, section, rollNo, salary, role, email, status, and password CANNOT be edited here.
    const allowed = [
      "contactNumber",
      "currentAddress",
      "profileImage",
      "bloodGroup",
      "dob",
      "religion",
    ];

    const safeUpdates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        safeUpdates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, safeUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
