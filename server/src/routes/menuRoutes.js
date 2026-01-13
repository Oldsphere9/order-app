import express from 'express';
import { getMenus, getMenuById, updateMenu } from '../controllers/menuController.js';

const router = express.Router();

// GET /api/menus - 메뉴 목록 조회
router.get('/', getMenus);

// GET /api/menus/:id - 특정 메뉴 조회
router.get('/:id', getMenuById);

// PATCH /api/menus/:id - 메뉴 정보 업데이트
router.patch('/:id', updateMenu);

export default router;
