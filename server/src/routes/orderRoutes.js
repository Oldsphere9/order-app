import express from 'express';
import { createOrder, getOrders, getOrderStats, deleteOrder, deleteMemberOrders, closeOrders, resetAllOrders } from '../controllers/orderController.js';

const router = express.Router();

// POST /api/orders - 주문 생성
router.post('/', createOrder);

// GET /api/orders - 주문 목록 조회
router.get('/', getOrders);

// GET /api/orders/stats - 주문 통계 조회
router.get('/stats', getOrderStats);

// POST /api/orders/close - 주문 마감
router.post('/close', closeOrders);

// DELETE /api/orders/reset - 모든 주문 리셋
router.delete('/reset', resetAllOrders);

// DELETE /api/orders/:id - 특정 주문 삭제
router.delete('/:id', deleteOrder);

// DELETE /api/orders/member/:member_id - 주문 인원의 모든 주문 삭제
router.delete('/member/:member_id', deleteMemberOrders);

export default router;
