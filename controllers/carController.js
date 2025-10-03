const Car = require("../models/car");
const User = require("../models/User");
const Request = require("../models/request");
const mongoose = require("mongoose");

// إنشاء سيارة جديدة وربطها بالمستخدم وإنشاء طلب موافقة
const createCar = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      brand,
      year,
      model,
      mileage,
      fuel_type,
      transmission,
      color,
    } = req.body;
    const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    // إنشاء السيارة بحالة pending
    const car = await Car.create({
      title,
      description,
      price,
      brand,
      year,
      images,
      owner: req.user.id,
      isApproved: "pending",
    });

    // ربط السيارة بالمستخدم
    const user = await User.findById(req.user.id);
    user.listedCars.push(car._id);
    await user.save();

    // إنشاء طلب موافقة مع مرجع السيارة
    await Request.create({
      car_data: {
        title,
        description,
        price,
        images,
        specs: {
          brand,
          model,
          year,
          mileage,
          fuel_type,
          transmission,
          color,
        },
      },
      car_ref: car._id, //  مرجع السيارة الأصلية
      submitted_by: req.user.id,
      status: "pending",
    });

    res.status(201).json({
      message: "Car created and approval request sent",
      car,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create car", error: error.message });
  }
};

// عرض السيارات المقبولة فقط مع فلترة وبحث
const getApprovedCars = async (req, res) => {
  try {
    const { title, brand, year, minPrice, maxPrice } = req.query;

    const query = { isApproved: "approved" };

    // 🔍 فلترة صارمة حسب العنوان
    if (title) {
      query.title = { $regex: `^${title}$`, $options: "i" }; // تطابق كامل مع تجاهل حالة الأحرف
    }

    // 🔍 فلترة صارمة حسب الماركة
    if (brand) {
      query.brand = { $regex: `^${brand}$`, $options: "i" };
    }

    // 📅 فلترة صارمة حسب السنة
    if (year) {
      query.year = { $gte: Number(year) };
    }

    // 💰 فلترة صارمة حسب السعر
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const cars = await Car.find(query).populate("owner", "name email");

    if (cars.length === 0) {
      return res.status(404).json({ message: "No cars found matching your filters" });
    }

    res.status(200).json({ cars });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cars", error: error.message });
  }
};

// عرض سيارة واحدة بالتفصيل
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("owner", "name email");
    if (!car) {
      return res.status(404).json({ message: "Car not found or not approved" });
    }

    res.status(200).json({ car });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch car", error: error.message });
  }
};

module.exports = {
  createCar,
  getApprovedCars,
  getCarById,
};
