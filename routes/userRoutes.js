const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { getUserProfileById } = require("../controllers/userController");

// عرض بروفايل مستخدم آخر
router.get("/:id", protect, getUserProfileById);
//تسجيل
router.post("/signUp", upload.single("profileImage"), registerUser);
//تسجيل الدخول
router.post("/login", loginUser);
//بروفايل المستخدم
router.get("/profile", protect, getUserProfile);

module.exports = router;
