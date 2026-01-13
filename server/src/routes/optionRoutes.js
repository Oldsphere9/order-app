import express from 'express';
import { getOptions } from '../controllers/optionController.js';

const router = express.Router();

// GET /api/options - 옵션 목록 조회
router.get('/', getOptions);

export default router;
