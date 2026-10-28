import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getMe,
  updateProfiles,
  refreshStats,
  getMyStats
} from "../controllers/userController.js";
import {
  followUser,
  unfollowUser,
  getPublicProfile,
  getFeed,
  getConnections,
  getFeedSummary
} from "../controllers/socialController.js";

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.get("/me/connections", authMiddleware, getConnections);
router.put("/profiles", authMiddleware, updateProfiles);
router.post("/refresh-stats", authMiddleware, refreshStats);
router.get("/stats", authMiddleware, getMyStats);

router.post("/:id/follow", authMiddleware, followUser);
router.post("/:id/unfollow", authMiddleware, unfollowUser);
router.get("/:id/profile", authMiddleware, getPublicProfile);
router.get("/feed/activity", authMiddleware, getFeed);
router.get("/feed/summary", authMiddleware, getFeedSummary);

export default router;
