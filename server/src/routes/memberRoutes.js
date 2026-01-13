import express from 'express';
import { getRecommendations } from '../controllers/memberController.js';

const router = express.Router();

// GET /api/members/recommendations - 추천 메뉴 조회
router.get('/recommendations', getRecommendations);

export default router;
