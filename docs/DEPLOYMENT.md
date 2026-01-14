# Render.com 배포 가이드

## 📋 배포 순서

### 1단계: PostgreSQL 데이터베이스 생성

1. **Render.com 대시보드 접속**
   - https://dashboard.render.com 접속
   - 로그인 또는 회원가입

2. **새 PostgreSQL 데이터베이스 생성**
   - "New +" 버튼 클릭
   - "PostgreSQL" 선택
   - 설정:
     - **Name**: `coffee-order-db` (또는 원하는 이름)
     - **Database**: `coffee_order_db`
     - **User**: 자동 생성됨
     - **Region**: 가장 가까운 지역 선택 (예: Singapore)
     - **PostgreSQL Version**: 14 이상 권장
     - **Plan**: Free tier 선택 (또는 유료 플랜)
   - "Create Database" 클릭

3. **데이터베이스 정보 저장**
   - 생성 완료 후 "Connections" 탭에서 다음 정보 확인:
     - **Internal Database URL**: 백엔드에서 사용
     - **External Database URL**: 로컬에서 접속 시 사용
     - **Host, Port, Database, User, Password** 정보 복사

---

### 2단계: 백엔드 서버 배포

1. **GitHub 저장소 준비**
   ```bash
   # 현재 프로젝트를 GitHub에 푸시
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Render.com에서 Web Service 생성**
   - "New +" 버튼 클릭
   - "Web Service" 선택
   - GitHub 저장소 연결
   - 설정:
     - **Name**: `coffee-order-api` (또는 원하는 이름)
     - **Region**: 데이터베이스와 동일한 지역 선택
     - **Branch**: `main`
     - **Root Directory**: `server` (중요!)
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free tier 선택

3. **환경 변수 설정**
   - "Environment" 섹션에서 다음 환경 변수 추가:
     ```
     NODE_ENV=production
     PORT=10000
     
     # 데이터베이스 연결 (PostgreSQL 서비스의 Internal Database URL 사용)
     DB_HOST=<database-host>
     DB_PORT=5432
     DB_NAME=coffee_order_db
     DB_USER=<database-user>
     DB_PASSWORD=<database-password>
     
     # 또는 Internal Database URL 전체를 사용하는 경우
     DATABASE_URL=<internal-database-url>
     
     # CORS 설정 (프론트엔드 URL로 변경 필요)
     CORS_ORIGIN=https://your-frontend-app.onrender.com
     ```

4. **데이터베이스 연결**
   - "Advanced" 섹션에서:
     - "Add Database" 클릭
     - 앞서 생성한 PostgreSQL 데이터베이스 선택
     - Render가 자동으로 `DATABASE_URL` 환경 변수 추가

5. **배포 시작**
   - "Create Web Service" 클릭
   - 배포 완료까지 대기 (약 5-10분)

6. **데이터베이스 초기화**
   - 배포 완료 후, 백엔드 서버의 "Shell" 탭에서:
     ```bash
     # 데이터베이스 스키마 생성
     npm run setup-db
     
     # 초기 메뉴 데이터 삽입 (필요한 경우)
     npm run insert-menus
     
     # member_menu_preferences 테이블 생성
     npm run create-member-menu-preferences-table
     ```

7. **백엔드 URL 확인**
   - 배포 완료 후 "Settings" 탭에서 URL 확인
   - 예: `https://coffee-order-api.onrender.com`

---

### 3단계: 프론트엔드 배포

#### 옵션 A: Static Site로 배포 (권장)

1. **프론트엔드 빌드 설정 확인**
   - `ui/package.json`에 `build` 스크립트가 있는지 확인
   - `ui/vite.config.js` 설정 확인

2. **Render.com에서 Static Site 생성**
   - "New +" 버튼 클릭
   - "Static Site" 선택
   - GitHub 저장소 연결
   - 설정:
     - **Name**: `coffee-order-app` (또는 원하는 이름)
     - **Branch**: `main`
     - **Root Directory**: `ui` (중요!)
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
     - **Environment Variables**:
       ```
       VITE_API_URL=https://coffee-order-api.onrender.com/api
       ```

3. **배포 시작**
   - "Create Static Site" 클릭
   - 배포 완료까지 대기

#### 옵션 B: Web Service로 배포

1. **프론트엔드 서버 설정 추가**
   - `ui/package.json`에 다음 스크립트 추가 필요:
     ```json
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "start": "vite preview --port $PORT --host"
     }
     ```

2. **Render.com에서 Web Service 생성**
   - "New +" 버튼 클릭
   - "Web Service" 선택
   - 설정:
     - **Name**: `coffee-order-app`
     - **Root Directory**: `ui`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start`
     - **Environment Variables**:
       ```
       VITE_API_URL=https://coffee-order-api.onrender.com/api
       PORT=10000
       ```

---

## 🔧 배포 후 확인 사항

### 1. 백엔드 API 확인
```bash
# 브라우저에서 접속
https://coffee-order-api.onrender.com/

# 응답 예시:
{
  "message": "커피 주문 앱 API 서버",
  "version": "1.0.0",
  "endpoints": {
    "menus": "/api/menus",
    "options": "/api/options",
    "orders": "/api/orders",
    "members": "/api/members"
  }
}
```

### 2. 프론트엔드 확인
- 브라우저에서 프론트엔드 URL 접속
- 메뉴 목록이 정상적으로 로드되는지 확인
- 주문 기능이 정상 작동하는지 확인

### 3. CORS 설정 확인
- 브라우저 개발자 도구 콘솔에서 CORS 에러가 없는지 확인
- 백엔드의 `CORS_ORIGIN` 환경 변수가 프론트엔드 URL과 일치하는지 확인

---

## 🐛 문제 해결

### 데이터베이스 연결 실패
- **원인**: 환경 변수 설정 오류
- **해결**: 
  - Render 대시보드에서 데이터베이스 서비스를 백엔드 서비스에 연결
  - `DATABASE_URL` 또는 개별 DB 환경 변수 확인

### CORS 에러
- **원인**: 백엔드의 `CORS_ORIGIN`이 프론트엔드 URL과 일치하지 않음
- **해결**: 
  - 백엔드 환경 변수에서 `CORS_ORIGIN`을 프론트엔드 URL로 업데이트
  - 여러 도메인 허용이 필요한 경우: `CORS_ORIGIN=https://app1.onrender.com,https://app2.onrender.com`

### 빌드 실패
- **원인**: Root Directory 설정 오류
- **해결**: 
  - 백엔드: Root Directory = `server`
  - 프론트엔드: Root Directory = `ui`

### 환경 변수 인식 안 됨
- **원인**: Vite는 `VITE_` 접두사 필요
- **해결**: 프론트엔드 환경 변수는 반드시 `VITE_`로 시작해야 함

---

## 📝 체크리스트

배포 전 확인:
- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] PostgreSQL 데이터베이스 생성 완료
- [ ] 백엔드 환경 변수 설정 완료
- [ ] 프론트엔드 환경 변수 설정 완료
- [ ] 데이터베이스 스키마 초기화 완료
- [ ] CORS 설정 확인 완료

배포 후 확인:
- [ ] 백엔드 API 정상 응답
- [ ] 프론트엔드 정상 로드
- [ ] 메뉴 목록 표시 확인
- [ ] 주문 기능 정상 작동
- [ ] 데이터베이스 연결 확인

---

## 🔄 업데이트 배포

코드 변경 후 자동 배포:
- GitHub에 푸시하면 Render가 자동으로 재배포
- 또는 Render 대시보드에서 "Manual Deploy" 클릭

수동 재배포:
1. Render 대시보드에서 서비스 선택
2. "Manual Deploy" → "Deploy latest commit" 클릭
