const Request = require("../models/request");
const Car = require("../models/car");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
// عرض كل الطلبات (للمدراء فقط)
const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await Request.find(filter)
      .populate("submitted_by", "name email")
      .populate("reviewed_by", "name email")
      .populate("car_ref", "title price isApproved");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch requests", error: error.message });
  }
};

// موافقة على الطلب → تعديل السيارة الأصلية
const approveRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Request already processed" });

    const car = await Car.findById(request.car_ref);
    if (!car) return res.status(404).json({ message: "Original car not found" });

    car.isApproved = "approved";

    await car.save();

    request.status = "approved";
    request.reviewed_by = req.user.id;
    request.reviewed_at = new Date();
    await request.save();

    const user = await User.findById(request.submitted_by);
    if (!user.listedCars.includes(car._id)) {
      user.listedCars.push(car._id);
      await user.save();
    }

    res.status(200).json({ message: "Request approved and car published", request });
  } catch (error) {
    res.status(500).json({ message: "Approval failed", error: error.message });
  }
};

// رفض الطلب → تحديث الحالة مع رسالة
const rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Request already processed" });

    if (request.car_ref) {
      const car = await Car.findById(request.car_ref);
      if (car) {
        car.isApproved = "rejected"; // أو false أو حسب نوع الحقل
        await car.save();
      }
    }

    request.status = "rejected";
    request.reviewed_by = req.user.id;
    request.reviewed_at = new Date();
    request.rejection_message = req.body.message || "";
    await request.save();

    res.status(200).json({ message: "Request rejected", request });
  } catch (error) {
    res.status(500).json({ message: "Rejection failed", error: error.message });
  }
};

// عرض طلب واحد بالتفصيل (للمدراء فقط)
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("submitted_by", "name email")
      .populate("reviewed_by", "name email")
      .populate("car_ref", "title price isApproved");

    if (!request) return res.status(404).json({ message: "Request not found" });

    res.status(200).json({ request });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch request", error: error.message });
  }
};

// عرض طلبات المستخدم الخاصة
const getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { submitted_by: req.user.id };

    if (status) {
      filter.status = status;
    }

    const requests = await Request.find(filter)
      .populate("car_ref", "title price isApproved images")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your requests", error: error.message });
  }
};
const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("car_ref");

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.submitted_by.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Only pending requests can be edited" });

    const {
      title,
      description,
      price,
      brand,
      model,
      year,
      mileage,
      fuel_type,
      transmission,
      color,
    } = req.body;

    const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    //  تعديل بيانات الطلب
    if (title) request.car_data.title = title;
    if (description) request.car_data.description = description;
    if (price) request.car_data.price = price;
    if (images.length > 0) request.car_data.images = images;
    request.car_data.specs = {
      brand: brand || request.car_data.specs.brand,
      model: model || request.car_data.specs.model,
      year: year || request.car_data.specs.year,
      mileage: mileage || request.car_data.specs.mileage,
      fuel_type: fuel_type || request.car_data.specs.fuel_type,
      transmission: transmission || request.car_data.specs.transmission,
      color: color || request.car_data.specs.color,
    };

    //  تعديل بيانات السيارة المرتبطة
    const car = request.car_ref;
    if (car) {
      if (title) car.title = title;
      if (description) car.description = description;
      if (price) car.price = price;
      if (brand) car.brand = brand;
      if (year) car.year = year;
      if (images.length > 0) car.images = images;
      await car.save();
    }

    await request.save();

    res.status(200).json({ message: "Request and car updated successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

const deleteApprovedRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("car_ref");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    //  تحقق من ملكية الطلب
    if (request.submitted_by.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to delete this request" });
    }

    //  تحقق من حالة الطلب
    if (request.status !== "approved") {
      return res.status(400).json({ message: "Only approved requests can be deleted after sale" });
    }

    //  حذف الصور من السيرفر
    request.car_data.images.forEach((imgPath) => {
      const fullPath = path.join(__dirname, "..", imgPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    //  حذف السيارة
    await Car.findByIdAndDelete(request.car_ref._id);

    //  حذف الطلب
    await Request.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Request and car deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete request", error: error.message });
  }
};

module.exports = {
  getAllRequests,
  approveRequest,
  rejectRequest,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteApprovedRequest,
};
