const express = require("express");
const router = express.Router();
const {
  getAllRequests,
  approveRequest,
  rejectRequest,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteApprovedRequest,
} = require("../controllers/requestController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
// عرض طلبات المستخدم الخاصة
router.get("/myRequests", protect, getMyRequests);

//  عرض كل الطلبات (للمدراء فقط)
router.get("/", protect, adminOnly, getAllRequests);

//  عرض طلب واحد بالتفصيل (للمدراء فقط)
router.get("/:id", protect, adminOnly, getRequestById);

//  موافقة على طلب
router.put("/:id/approve", protect, adminOnly, approveRequest);

//  رفض طلب
router.put("/:id/reject", protect, adminOnly, rejectRequest);
//  تعديل الطلب
router.put("/:id", protect, upload.array("images"), updateRequest);
//  حذف الطلب والسيارة بعد البيع

router.delete("/:id", protect, deleteApprovedRequest);
module.exports = router;
