import express from "express";
const categoryRouter = express.Router();
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
} from "../controller/categoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

// Public routes
categoryRouter.get("/categories", getAllCategories);
categoryRouter.get("/categories/slug/:slug", getCategoryBySlug);
categoryRouter.post("/categories/seed", authenticate, authorize("admin", "super_admin"), seedCategories);

// Admin routes
categoryRouter.post("/categories", authenticate, authorize("admin", "super_admin"), createCategory);
categoryRouter.put("/categories/:id", authenticate, authorize("admin", "super_admin"), updateCategory);
categoryRouter.delete("/categories/:id", authenticate, authorize("admin", "super_admin"), deleteCategory);

export default categoryRouter;

