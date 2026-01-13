import express from 'express';
import { createOrder, getOrders, getOrderStats } from '../controllers/orderController.js';

const router = express.Router();

// POST /api/orders - 주문 생성
router.post('/', createOrder);

// GET /api/orders - 주문 목록 조회
router.get('/', getOrders);

// GET /api/orders/stats - 주문 통계 조회
router.get('/stats', getOrderStats);

export default router;
