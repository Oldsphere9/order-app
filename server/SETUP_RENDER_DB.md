# Render 데이터베이스 스키마 생성 가이드

## .env 파일 설정 확인

Render.com의 데이터베이스 연결을 위해 `.env` 파일에 다음 중 하나를 설정해야 합니다:

### 옵션 1: DATABASE_URL 사용 (권장)

Render.com의 데이터베이스 서비스에서 "Connections" 탭의 **Internal Database URL**을 복사하여 `.env` 파일에 추가:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**중요**: 
- Internal Database URL을 사용하세요 (External이 아님)
- URL 형식이 정확해야 합니다: `postgresql://` 또는 `postgres://`로 시작
- `@` 앞에 사용자명이 있어야 합니다

### 옵션 2: 개별 환경 변수 사용

```env
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=order_app_db_xxxxx
DB_USER=order_app_db_xxxxx_user
DB_PASSWORD=your_password_here
```

## 스키마 생성 실행

.env 파일을 올바르게 설정한 후:

```bash
cd server
npm run setup-db
```

## 추가 스크립트 실행

스키마 생성 후 다음 스크립트들을 순서대로 실행:

```bash
# 초기 메뉴 데이터 삽입
npm run insert-menus

# member_menu_preferences 테이블 생성
npm run create-member-menu-preferences-table
```

## 문제 해결

### 에러: "getaddrinfo ENOTFOUND @host"
- 원인: DATABASE_URL 형식이 잘못됨
- 해결: DATABASE_URL이 `postgresql://user:password@host:port/database` 형식인지 확인

### 에러: "connection refused"
- 원인: 데이터베이스 호스트에 접근할 수 없음
- 해결: Internal Database URL을 사용하고 있는지 확인 (External이 아님)

### 에러: "authentication failed"
- 원인: 사용자명 또는 비밀번호가 잘못됨
- 해결: Render.com의 데이터베이스 서비스에서 연결 정보를 다시 확인
