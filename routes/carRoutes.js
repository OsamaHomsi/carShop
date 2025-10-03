const express = require("express");
const router = express.Router();
const { createCar, getCarById, getApprovedCars } = require("../controllers/carController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post("/", protect, upload.array("images"), createCar);
router.get("/approved", getApprovedCars); // ✅ عرض السيارات المقبولة
router.get("/:id", getCarById);

module.exports = router;
