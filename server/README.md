# 커피 주문 앱 - 백엔드 서버

Express.js를 사용한 RESTful API 서버입니다.

## 기술 스택

- **Node.js**: JavaScript 런타임
- **Express.js**: 웹 애플리케이션 프레임워크
- **PostgreSQL**: 관계형 데이터베이스
- **pg**: PostgreSQL 클라이언트

## 프로젝트 구조

```
server/
├── src/
│   ├── config/          # 설정 파일
│   │   ├── database.js  # 데이터베이스 연결 설정
│   │   ├── database.sql # 데이터베이스 스키마
│   │   └── initDatabase.js # 데이터베이스 초기화
│   ├── controllers/     # 컨트롤러 (비즈니스 로직)
│   │   ├── menuController.js
│   │   ├── optionController.js
│   │   └── orderController.js
│   ├── routes/          # 라우트 정의
│   │   ├── menuRoutes.js
│   │   ├── optionRoutes.js
│   │   └── orderRoutes.js
│   ├── scripts/         # 유틸리티 스크립트
│   │   └── setupDatabase.js # 데이터베이스 설정 스크립트
│   ├── models/          # 데이터 모델 (추후 추가)
│   ├── middleware/       # 미들웨어 (추후 추가)
│   ├── utils/           # 유틸리티 함수 (추후 추가)
│   └── server.js        # 서버 진입점
├── .env                 # 환경 변수 (생성 필요)
├── .gitignore
├── package.json
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 필요한 환경 변수를 설정하세요.

```bash
# .env 파일 내용
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_order_db
DB_USER=postgres
DB_PASSWORD=your_password

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**중요:** `DB_PASSWORD`를 실제 PostgreSQL 비밀번호로 변경하세요.

### 3. PostgreSQL 데이터베이스 생성

PostgreSQL에 접속하여 데이터베이스를 생성하세요:

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE coffee_order_db;

# 종료
\q
```

### 4. 데이터베이스 스키마 생성

다음 명령어로 데이터베이스 테이블을 생성합니다:

```bash
npm run setup-db
```

이 명령어는 다음을 수행합니다:
- 데이터베이스 연결 테스트
- 테이블 생성 (Menus, Options, Members, Orders)
- 인덱스 생성
- 트리거 생성
- 기본 옵션 데이터 삽입

### 5. 서버 실행

**개발 모드 (nodemon 사용):**
```bash
npm run dev
```

**프로덕션 모드:**
```bash
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### 메뉴 관련
- `GET /api/menus` - 메뉴 목록 조회
- `GET /api/menus/:id` - 특정 메뉴 조회
- `PATCH /api/menus/:id` - 메뉴 정보 업데이트

### 옵션 관련
- `GET /api/options` - 옵션 목록 조회

### 주문 관련
- `POST /api/orders` - 주문 생성
- `GET /api/orders` - 주문 목록 조회
- `GET /api/orders/stats` - 주문 통계 조회

## 데이터베이스 스키마

### 테이블 구조

1. **menus** - 메뉴 정보
   - id, name, description, category, base_price, sale_status

2. **options** - 옵션 정보
   - id, name, option_type, price, menu_id

3. **members** - 주문 인원 정보
   - id, team, name, employee_id

4. **orders** - 주문 내용
   - id, member_id, menu_id, quantity, options (JSON), unit_price, total_price

자세한 스키마는 `src/config/database.sql` 파일을 참고하세요.

## 개발 가이드

### 데이터베이스 스키마

데이터베이스 스키마는 `docs/PRD.md`의 "6. 백엔드 개발 요구사항" 섹션을 참고하세요.

### 다음 단계

1. ✅ 데이터베이스 스키마 생성 (완료)
2. 모델 구현 (Menus, Options, Members, Orders)
3. 컨트롤러 비즈니스 로직 구현
4. 에러 처리 및 검증 미들웨어 추가
5. 테스트 작성

## 문제 해결

### 데이터베이스 연결 오류

1. PostgreSQL이 실행 중인지 확인:
   ```bash
   # macOS
   brew services list
   
   # 또는
   pg_isready
   ```

2. 데이터베이스가 생성되었는지 확인:
   ```bash
   psql -U postgres -l
   ```

3. `.env` 파일의 데이터베이스 설정 확인

### 포트가 이미 사용 중인 경우

다른 포트를 사용하거나 기존 프로세스를 종료:
```bash
# 포트 3000을 사용하는 프로세스 찾기
lsof -ti:3000

# 프로세스 종료
kill -9 $(lsof -ti:3000)
```
