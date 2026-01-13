# 데이터베이스 설정 가이드

## PostgreSQL 시작하기

### macOS에서 PostgreSQL 시작

PostgreSQL 설치 방법에 따라 시작 방법이 다릅니다:

#### 1. Homebrew로 설치한 경우

```bash
# PostgreSQL 시작
brew services start postgresql@14
# 또는
brew services start postgresql@15
# 또는
brew services start postgresql@16

# 실행 중인지 확인
brew services list
```

#### 2. PostgreSQL.app으로 설치한 경우

- Applications 폴더에서 PostgreSQL.app 실행
- 또는 Launchpad에서 PostgreSQL 검색 후 실행

#### 3. 수동 설치한 경우

```bash
# PostgreSQL 시작
pg_ctl -D /usr/local/var/postgres start

# 또는 시스템 서비스로 시작
sudo launchctl load -w /Library/LaunchDaemons/com.edb.launchd.postgresql-*.plist
```

### PostgreSQL 실행 확인

```bash
# PostgreSQL이 실행 중인지 확인
ps aux | grep postgres

# 또는 포트 확인
lsof -i :5432
```

## 데이터베이스 생성

PostgreSQL이 실행 중인 상태에서 다음 명령어를 실행하세요:

### 방법 1: psql 사용

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE coffee_order_db;

# 종료
\q
```

### 방법 2: createdb 명령어 사용

```bash
createdb -U postgres coffee_order_db
```

### 방법 3: Node.js 스크립트 사용 (권장)

```bash
cd /Users/hongoo/Documents/order_app/server
npm run create-db
```

## .env 파일 설정 확인

`server/.env` 파일에서 다음 설정을 확인하세요:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_order_db
DB_USER=postgres
DB_PASSWORD=your_password  # 실제 비밀번호로 변경
```

**중요:** 
- `DB_PASSWORD`를 실제 PostgreSQL 비밀번호로 변경하세요
- 기본 사용자가 `postgres`가 아닌 경우 `DB_USER`도 변경하세요

## 데이터베이스 스키마 생성

데이터베이스가 생성된 후 다음 명령어로 스키마를 생성하세요:

```bash
cd /Users/hongoo/Documents/order_app/server
npm run setup-db
```

이 명령어는 다음을 수행합니다:
- ✅ 데이터베이스 연결 테스트
- ✅ 테이블 생성 (Menus, Options, Members, Orders)
- ✅ 인덱스 및 트리거 생성
- ✅ 기본 옵션 데이터 삽입

## 문제 해결

### 1. "PostgreSQL 서버에 연결할 수 없습니다"

**해결 방법:**
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 `DB_HOST`와 `DB_PORT` 확인
- 방화벽 설정 확인

### 2. "인증 실패"

**해결 방법:**
- `.env` 파일의 `DB_USER`와 `DB_PASSWORD` 확인
- PostgreSQL 사용자 비밀번호 확인

### 3. "데이터베이스가 존재하지 않습니다"

**해결 방법:**
```bash
npm run create-db
```

### 4. "명령어를 찾을 수 없습니다" (psql, createdb 등)

**해결 방법:**
- PostgreSQL의 bin 디렉토리를 PATH에 추가
- 또는 전체 경로로 실행:
  ```bash
  /usr/local/bin/psql -U postgres
  ```

## 다음 단계

데이터베이스 설정이 완료되면:

1. 서버 실행: `npm run dev`
2. API 테스트: `http://localhost:3000/api/menus`
