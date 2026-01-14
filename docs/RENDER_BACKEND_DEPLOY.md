# Render.com 백엔드 서비스 배포 가이드

## 📋 사전 준비사항

✅ GitHub에 코드 푸시 완료
✅ Render.com 계정 생성 완료
✅ PostgreSQL 데이터베이스 생성 완료 (스키마 생성 완료)

---

## 🚀 백엔드 서비스 배포 단계

### 1단계: Render.com 대시보드 접속

1. 브라우저에서 https://dashboard.render.com 접속
2. GitHub 계정으로 로그인 (또는 회원가입)

---

### 2단계: Web Service 생성

1. **"New +" 버튼 클릭**
   - 우측 상단 또는 대시보드 중앙의 **"New +"** 버튼 클릭

2. **"Web Service" 선택**
   - 드롭다운 메뉴에서 **"Web Service"** 선택

---

### 3단계: GitHub 저장소 연결

1. **"Connect account" 또는 "Connect repository" 클릭**
   - GitHub 계정이 연결되지 않은 경우 GitHub 인증 진행

2. **저장소 선택**
   - 저장소 목록에서 `Oldsphere9/order-app` (또는 본인의 저장소) 선택
   - 또는 저장소 검색하여 선택

---

### 4단계: 서비스 기본 설정

다음 정보를 입력합니다:

- **Name**: `coffee-order-api` (원하는 이름으로 변경 가능)
- **Region**: 데이터베이스와 동일한 지역 선택 (예: `Oregon (US West)` 또는 `Singapore`)
- **Branch**: `main` (또는 기본 브랜치)
- **Root Directory**: `server` ⚠️ **매우 중요!**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (또는 유료 플랜)

⚠️ **주의사항**:
- **Root Directory**를 반드시 `server`로 설정해야 합니다
- 이 설정이 없으면 프로젝트 루트에서 빌드를 시도하여 실패합니다

---

### 5단계: 환경 변수 설정

**"Advanced"** 섹션을 클릭하여 환경 변수를 추가합니다:

#### 필수 환경 변수:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

2. **PORT**
   - Key: `PORT`
   - Value: `10000`
   - ⚠️ Render.com은 자동으로 PORT 환경 변수를 제공하지만, 명시적으로 설정하는 것이 안전합니다

3. **CORS_ORIGIN**
   - Key: `CORS_ORIGIN`
   - Value: `https://coffee-order-app.onrender.com`
   - ⚠️ **임시 값**: 프론트엔드 배포 후 실제 URL로 변경 필요

#### 환경 변수 추가 방법:

1. **"Add Environment Variable"** 버튼 클릭
2. Key와 Value 입력
3. **"Add"** 클릭
4. 모든 환경 변수를 추가할 때까지 반복

---

### 6단계: 데이터베이스 연결

1. **"Add Database" 버튼 클릭**
   - "Advanced" 섹션 하단에 있음

2. **데이터베이스 선택**
   - 드롭다운에서 앞서 생성한 PostgreSQL 데이터베이스 선택
   - 예: `coffee-order-db`

3. **자동 환경 변수 생성 확인**
   - Render가 자동으로 `DATABASE_URL` 환경 변수를 추가합니다
   - 이 변수는 데이터베이스의 Internal Database URL을 포함합니다

---

### 7단계: 배포 시작

1. **"Create Web Service" 버튼 클릭**
   - 모든 설정이 완료되었는지 다시 한 번 확인

2. **배포 진행 상황 확인**
   - 배포가 시작되면 "Logs" 탭에서 진행 상황을 실시간으로 확인할 수 있습니다
   - 빌드 및 배포 과정이 표시됩니다

3. **배포 완료 대기**
   - 첫 배포는 약 5-10분 소요됩니다
   - "Live" 상태가 되면 배포 완료입니다

---

### 8단계: 배포 확인

1. **서비스 URL 확인**
   - 배포 완료 후 **"Settings"** 탭에서 URL 확인
   - 예: `https://coffee-order-api.onrender.com`

2. **API 테스트**
   - 브라우저에서 다음 URL 접속:
     ```
     https://coffee-order-api.onrender.com/
     ```
   - 정상 응답 예시:
     ```json
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

3. **메뉴 API 테스트**
   - 브라우저에서 다음 URL 접속:
     ```
     https://coffee-order-api.onrender.com/api/menus?status=active
     ```
   - 메뉴 목록이 JSON 형식으로 표시되어야 합니다

---

### 9단계: 데이터베이스 초기화 (이미 완료된 경우 생략 가능)

⚠️ **참고**: 이미 로컬에서 데이터베이스 스키마를 생성했다면 이 단계는 생략할 수 있습니다.

하지만 Render의 데이터베이스에 직접 접속하여 확인하거나, 추가 스크립트를 실행해야 하는 경우:

1. **Shell 탭 열기**
   - 백엔드 서비스 페이지에서 **"Shell"** 탭 클릭

2. **데이터베이스 스키마 생성** (필요한 경우)
   ```bash
   npm run setup-db
   ```

3. **초기 메뉴 데이터 삽입** (필요한 경우)
   ```bash
   npm run insert-menus
   ```

4. **member_menu_preferences 테이블 생성** (필요한 경우)
   ```bash
   npm run create-member-menu-preferences-table
   ```

---

## 🔧 문제 해결

### 문제 1: 빌드 실패

**증상**: 배포 로그에 "Build failed" 메시지

**원인 및 해결**:
1. **Root Directory 확인**
   - Settings → Root Directory가 `server`로 설정되어 있는지 확인

2. **package.json 확인**
   - `server/package.json`에 `start` 스크립트가 있는지 확인
   - 올바른 형식: `"start": "node src/server.js"`

3. **의존성 문제**
   - 로컬에서 `cd server && npm install` 실행하여 문제 확인

### 문제 2: 데이터베이스 연결 실패

**증상**: 로그에 "데이터베이스 연결 오류" 메시지

**원인 및 해결**:
1. **DATABASE_URL 확인**
   - Environment 탭에서 `DATABASE_URL` 환경 변수가 있는지 확인
   - 데이터베이스 서비스를 백엔드에 연결했는지 확인

2. **데이터베이스 서비스 상태 확인**
   - 데이터베이스 서비스가 "Available" 상태인지 확인

3. **Internal Database URL 사용 확인**
   - External Database URL이 아닌 Internal Database URL을 사용해야 합니다
   - Render가 자동으로 Internal URL을 제공합니다

### 문제 3: 포트 바인딩 에러

**증상**: "Port binding failed" 또는 "EADDRINUSE" 에러

**원인 및 해결**:
1. **PORT 환경 변수 확인**
   - Environment 탭에서 `PORT=10000` 설정 확인
   - 또는 `process.env.PORT`를 사용하도록 코드 확인

2. **서버 코드 확인**
   - `server.js`에서 `app.listen(process.env.PORT || 3000)` 형식인지 확인

### 문제 4: CORS 에러

**증상**: 브라우저 콘솔에 "CORS policy" 에러

**원인 및 해결**:
1. **CORS_ORIGIN 확인**
   - Environment 탭에서 `CORS_ORIGIN`이 프론트엔드 URL과 일치하는지 확인
   - 프론트엔드 배포 후 실제 URL로 업데이트 필요

2. **여러 도메인 허용**
   - 여러 도메인을 허용하려면 쉼표로 구분:
     ```
     CORS_ORIGIN=https://app1.onrender.com,https://app2.onrender.com
     ```

---

## 📝 체크리스트

배포 전 확인:
- [ ] GitHub에 코드 푸시 완료
- [ ] PostgreSQL 데이터베이스 생성 완료
- [ ] 데이터베이스 스키마 생성 완료 (로컬에서 실행)

배포 설정:
- [ ] Web Service 생성
- [ ] GitHub 저장소 연결
- [ ] Root Directory: `server` 설정
- [ ] Build Command: `npm install` 설정
- [ ] Start Command: `npm start` 설정
- [ ] 환경 변수 설정 완료:
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
  - [ ] CORS_ORIGIN 설정
- [ ] 데이터베이스 연결 완료

배포 후 확인:
- [ ] 배포 완료 (Live 상태)
- [ ] API 엔드포인트 정상 응답 확인
- [ ] 메뉴 API 정상 작동 확인
- [ ] 데이터베이스 연결 확인

---

## 🔄 업데이트 배포

### 자동 배포
- GitHub에 코드를 푸시하면 Render가 자동으로 재배포합니다
- 배포 로그에서 진행 상황을 확인할 수 있습니다

### 수동 재배포
1. Render 대시보드에서 백엔드 서비스 선택
2. **"Manual Deploy"** 버튼 클릭
3. **"Deploy latest commit"** 선택

### 특정 커밋 배포
1. **"Manual Deploy"** → **"Deploy specific commit"** 선택
2. 배포할 커밋 해시 입력

---

## 💡 Free Tier 제한사항

- **Sleep 모드**: 15분간 요청이 없으면 서비스가 sleep 상태로 전환됩니다
- **첫 요청 지연**: Sleep 상태에서 첫 요청 시 깨어나는 데 30초~1분 소요됩니다
- **빌드 시간**: 무료 플랜은 빌드 시간이 제한될 수 있습니다

---

## 📞 다음 단계

백엔드 배포가 완료되면:
1. 프론트엔드 배포 진행
2. 프론트엔드 배포 후 백엔드의 `CORS_ORIGIN` 환경 변수를 실제 프론트엔드 URL로 업데이트
