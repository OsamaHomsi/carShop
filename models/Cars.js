const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true }, // للبحث حسب العنوان
    description: { type: String },
    price: { type: Number, required: true, index: true }, // للفرز أو الفلاتر حسب السعر
    images: [{ type: String }],
    brand: { type: String, index: true }, // للبحث حسب الماركة
    year: { type: Number },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    isApproved: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true, // لتصفية السيارات حسب الحالة
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
