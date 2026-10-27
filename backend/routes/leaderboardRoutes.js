import express from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get("/", authMiddleware, getLeaderboard);

export default router;
