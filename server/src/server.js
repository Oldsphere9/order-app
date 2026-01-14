import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import menuRoutes from './routes/menuRoutes.js';
import optionRoutes from './routes/optionRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import { ensureTimePatternColumn, ensureMembersTableSchema } from './config/initDatabase.js';

// 환경 변수 로드 (.env 파일)
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
// CORS 설정: 여러 origin 허용 (배포 환경 대응)
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// 디버깅: 허용된 origin 목록 로그
console.log('허용된 CORS Origins:', allowedOrigins);
console.log('CORS_ORIGIN 환경 변수:', process.env.CORS_ORIGIN);

app.use(cors({
  origin: (origin, callback) => {
    // 디버깅: 요청 origin 로그
    console.log('요청 Origin:', origin);
    
    // origin이 없거나 (같은 도메인 요청) 허용된 origin 목록에 있으면 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS 차단 - 요청 Origin:', origin, '허용된 Origins:', allowedOrigins);
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/menus', menuRoutes);
app.use('/api/options', optionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/members', memberRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '커피 주문 앱 API 서버',
    version: '1.0.0',
    endpoints: {
      menus: '/api/menus',
      options: '/api/options',
      orders: '/api/orders',
      members: '/api/members'
    }
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API 엔드포인트: http://localhost:${PORT}/api`);
  console.log(`허용된 CORS Origins: ${allowedOrigins.join(', ')}`);
  
  // 서버 시작 시 데이터베이스 마이그레이션 실행
  try {
    console.log('데이터베이스 마이그레이션 시작...');
    
    // 1. time_pattern 컬럼 확인 및 추가
    await ensureTimePatternColumn();
    
    // 2. Members 테이블 스키마 마이그레이션 (employee_id UNIQUE 제약조건 변경)
    await ensureMembersTableSchema();
    
    console.log('✅ 데이터베이스 마이그레이션 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 마이그레이션 중 오류:', error);
    console.error('에러 상세:', error.message);
    console.error('스택:', error.stack);
    // 마이그레이션 실패해도 서버는 계속 실행
    console.log('⚠️ 마이그레이션 실패했지만 서버는 계속 실행됩니다.');
  }
  
  console.log('✅ 서버 준비 완료 - 요청 대기 중...');
});

export default app;
