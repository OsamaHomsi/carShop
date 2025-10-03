const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    car_data: {
      title: { type: String, required: true },
      description: { type: String },
      price: { type: Number, required: true },
      images: [{ type: String }],
      specs: {
        brand: String,
        model: String,
        year: Number,
        mileage: Number,
        fuel_type: String,
        transmission: String,
        color: String,
      },
    },
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    car_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
    rejection_message: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
