const Car = require("../models/Cars");
const User = require("../models/Users");
const Request = require("../models/Requests");
const mongoose = require("mongoose");
const cache = require("../utils/caches"); //

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

    const user = await User.findById(req.user.id);
    user.listedCars.push(car._id);
    await user.save();

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
      car_ref: car._id,
      submitted_by: req.user.id,
      status: "pending",
    });

    //  حذف الكاش المرتبط بالسيارات المقبولة
    cache.flushAll();

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
    if (title) query.title = { $regex: `^${title}$`, $options: "i" };
    if (brand) query.brand = { $regex: `^${brand}$`, $options: "i" };
    if (year) query.year = { $gte: Number(year) };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    //  استخدم الكاش حسب الفلاتر
    const cacheKey = `approvedCars_${JSON.stringify(query)}`;
    const cachedCars = cache.get(cacheKey);
    if (cachedCars) return res.status(200).json({ cars: cachedCars });

    const cars = await Car.find(query).populate("owner", "name email");
    if (cars.length === 0) {
      return res.status(404).json({ message: "No cars found matching your filters" });
    }

    cache.set(cacheKey, cars); //  تخزين النتيجة في الكاش
    res.status(200).json({ cars });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cars", error: error.message });
  }
};

// عرض سيارة واحدة بالتفصيل
const getCarById = async (req, res) => {
  try {
    const cacheKey = `car_${req.params.id}`;
    const cachedCar = cache.get(cacheKey);
    if (cachedCar) return res.status(200).json({ car: cachedCar });

    const car = await Car.findById(req.params.id).populate("owner", "name email");
    if (!car) {
      return res.status(404).json({ message: "Car not found or not approved" });
    }

    cache.set(cacheKey, car); //  تخزين النتيجة في الكاش
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
