const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true }, // للبحث حسب الاسم
    email: { type: String, required: true, unique: true, index: true }, // للبحث والتسجيل
    password: { type: String, required: true },
    address: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    profileImage: { type: String },
    listedCars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
