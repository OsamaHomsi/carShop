const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profileImage: { type: String }, // صورة المستخدم
    listedCars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }], // سيارات المستخدم
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
