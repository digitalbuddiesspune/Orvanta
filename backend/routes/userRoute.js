import express from "express";
const userRouter = express.Router();
import { getAllUsers, getProfile, updateProfile } from "../controller/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

userRouter.get("/profile", authenticate, getProfile);
userRouter.put("/profile", authenticate, updateProfile);

userRouter.route("/admin/users").get(
  authenticate,
  authorize('admin', 'super_admin'),
  getAllUsers
);

export default userRouter;


