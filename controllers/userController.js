const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const Car = require("../models/Cars");
const cache = require("../utils/caches"); //

// تسجيل مستخدم جديد مع رفع صورة
const registerUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      role: role === "admin" ? "admin" : "user",
      profileImage,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    cache.del(`user_${user._id}`); //  تنظيف  بعد لتسجيل

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        profileImage: user.profileImage,
        listedCars: user.listedCars,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// تسجيل لدخول
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        profileImage: user.profileImage,
        listedCars: user.listedCars,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// جلب بروفيل لمستخدم
const getUserProfile = async (req, res) => {
  try {
    const cacheKey = `user_${req.user.id}_full`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ user: cached });

    const user = await User.findById(req.user.id).select("-password").populate("listedCars");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      profileImage: user.profileImage,
      listedCars: user.listedCars,
    };

    cache.set(cacheKey, userData); //  تخزين لنتيجة
    res.status(200).json({ user: userData });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

// جلب بروفيل مستخدم حسب ID
const getUserProfileById = async (req, res) => {
  try {
    const cacheKey = `user_${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ user: cached });

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    cache.set(cacheKey, user); //  تخزين لنتيجة
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getUserProfileById,
};
