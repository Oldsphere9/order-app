# Render.com 프론트엔드 배포 가이드

## 📋 사전 확인

✅ 백엔드 서비스 배포 완료
✅ 백엔드 URL 확인 (예: `https://coffee-order-api.onrender.com`)

---

## 🔍 코드 확인 결과

현재 프론트엔드 코드는 이미 배포 준비가 되어 있습니다:

✅ `ui/src/utils/api.js`에서 `VITE_API_URL` 환경 변수 사용 중
✅ `package.json`에 `build` 스크립트 있음
✅ Vite 설정 기본 구성 완료

**코드 수정 불필요** - 환경 변수만 설정하면 됩니다!

---

## 🚀 배포 방법: Static Site (권장)

### 1단계: Static Site 생성

1. **Render.com 대시보드 접속**
   - https://dashboard.render.com

2. **"New +" 버튼 클릭**
   - 우측 상단 또는 대시보드 중앙

3. **"Static Site" 선택**
   - 드롭다운 메뉴에서 "Static Site" 선택

---

### 2단계: GitHub 저장소 연결

1. **GitHub 저장소 선택**
   - "Connect account" 또는 저장소 목록에서 선택
   - `Oldsphere9/order-app` 저장소 선택

---

### 3단계: 서비스 설정

다음 정보를 입력합니다:

- **Name**: `coffee-order-app` (원하는 이름)
- **Branch**: `main` (또는 기본 브랜치)
- **Root Directory**: `ui` ⚠️ **매우 중요!**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Plan**: `Free` (또는 유료 플랜)

⚠️ **중요 설정**:
- **Root Directory**를 반드시 `ui`로 설정해야 합니다
- 이 설정이 없으면 프로젝트 루트에서 빌드를 시도하여 실패합니다

---

### 4단계: 환경 변수 설정

**"Environment Variables"** 섹션에서 다음 변수 추가:

1. **VITE_API_URL**
   - Key: `VITE_API_URL`
   - Value: `https://coffee-order-api.onrender.com/api`
   - ⚠️ **주의**: 백엔드 서비스의 실제 URL로 변경하세요
   - URL 끝에 `/api` 포함 필수

---

### 5단계: 배포 시작

1. **"Create Static Site" 버튼 클릭**
   - 모든 설정이 완료되었는지 확인

2. **배포 진행 상황 확인**
   - "Logs" 탭에서 빌드 및 배포 진행 상황 확인

3. **배포 완료 대기**
   - 첫 배포는 약 3-5분 소요
   - "Live" 상태가 되면 배포 완료

---

### 6단계: 배포 확인

1. **서비스 URL 확인**
   - 배포 완료 후 Settings 탭에서 URL 확인
   - 예: `https://coffee-order-app.onrender.com`

2. **프론트엔드 접속 테스트**
   - 브라우저에서 프론트엔드 URL 접속
   - 메뉴 목록이 정상적으로 로드되는지 확인

3. **API 연결 확인**
   - 브라우저 개발자 도구 (F12) → Console 탭
   - API 호출이 정상적으로 작동하는지 확인
   - CORS 에러가 없는지 확인

---

## 🔄 백엔드 CORS 설정 업데이트

프론트엔드 배포가 완료되면 백엔드의 CORS 설정을 업데이트해야 합니다:

1. **백엔드 서비스로 이동**
   - Render 대시보드에서 백엔드 서비스 선택

2. **Environment Variables 수정**
   - "Environment" 탭 클릭
   - `CORS_ORIGIN` 환경 변수 찾기

3. **CORS_ORIGIN 업데이트**
   - Value를 실제 프론트엔드 URL로 변경:
     ```
     https://coffee-order-app.onrender.com
     ```
   - ⚠️ **주의**: URL 끝에 슬래시(`/`) 없이 입력

4. **변경사항 저장**
   - "Save Changes" 클릭
   - Render가 자동으로 재배포합니다

---

## 🚀 대안: Web Service로 배포

Static Site가 작동하지 않는 경우 Web Service로 배포할 수 있습니다:

### 설정:

- **Name**: `coffee-order-app`
- **Root Directory**: `ui`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variables**:
  - `VITE_API_URL=https://coffee-order-api.onrender.com/api`
  - `PORT=10000`

---

## 🔧 문제 해결

### 문제 1: 빌드 실패

**증상**: 배포 로그에 "Build failed" 메시지

**원인 및 해결**:
1. **Root Directory 확인**
   - Settings → Root Directory가 `ui`로 설정되어 있는지 확인

2. **Build Command 확인**
   - `npm install && npm run build` 형식인지 확인

3. **로컬에서 빌드 테스트**
   ```bash
   cd ui
   npm install
   npm run build
   ```
   - 로컬에서 빌드가 성공하는지 확인

### 문제 2: API 연결 실패

**증상**: 브라우저 콘솔에 "Network Error" 또는 CORS 에러

**원인 및 해결**:
1. **VITE_API_URL 확인**
   - Environment Variables에서 `VITE_API_URL`이 올바른지 확인
   - 백엔드 URL + `/api` 형식인지 확인
   - 예: `https://coffee-order-api.onrender.com/api`

2. **백엔드 CORS 설정 확인**
   - 백엔드의 `CORS_ORIGIN`이 프론트엔드 URL과 일치하는지 확인
   - URL 끝에 슬래시가 없는지 확인

3. **백엔드 서비스 상태 확인**
   - 백엔드 서비스가 "Live" 상태인지 확인
   - 브라우저에서 백엔드 URL 직접 접속하여 응답 확인

### 문제 3: 환경 변수 인식 안 됨

**증상**: API URL이 `undefined` 또는 기본값(`http://localhost:3000/api`) 사용

**원인 및 해결**:
1. **환경 변수 이름 확인**
   - Vite는 `VITE_` 접두사가 필요합니다
   - 올바른 이름: `VITE_API_URL`
   - 잘못된 이름: `API_URL`, `REACT_APP_API_URL`

2. **빌드 시점 확인**
   - 환경 변수는 빌드 시점에 주입됩니다
   - 환경 변수를 변경한 후 재배포 필요

3. **환경 변수 확인 방법**
   - 빌드 로그에서 환경 변수가 인식되는지 확인
   - 또는 코드에 임시로 `console.log(import.meta.env.VITE_API_URL)` 추가

### 문제 4: 404 에러 (라우팅 문제)

**증상**: 직접 URL 접속 시 404 에러

**원인 및 해결**:
1. **Vite 빌드 설정 확인**
   - `vite.config.js`에 `base` 설정이 필요할 수 있음
   - 하지만 기본 설정으로도 대부분 작동합니다

2. **Render Static Site 설정**
   - Render의 Static Site는 자동으로 `index.html`을 fallback으로 사용합니다
   - 추가 설정 불필요

---

## 📝 체크리스트

### 배포 전
- [ ] 백엔드 서비스 배포 완료
- [ ] 백엔드 URL 확인 및 저장
- [ ] 로컬에서 빌드 테스트 완료

### 배포 설정
- [ ] Static Site 생성
- [ ] GitHub 저장소 연결
- [ ] Root Directory: `ui` 설정
- [ ] Build Command: `npm install && npm run build` 설정
- [ ] Publish Directory: `dist` 설정
- [ ] `VITE_API_URL` 환경 변수 설정

### 배포 후
- [ ] 배포 완료 (Live 상태)
- [ ] 프론트엔드 URL 확인
- [ ] 프론트엔드 정상 로드 확인
- [ ] API 연결 확인
- [ ] 백엔드 CORS_ORIGIN 업데이트 완료

---

## 💡 참고사항

### 환경 변수 작동 방식

- Vite는 빌드 시점에 `VITE_` 접두사가 있는 환경 변수를 주입합니다
- 런타임에 환경 변수를 변경해도 반영되지 않습니다
- 환경 변수 변경 후 재배포 필요

### Free Tier 제한사항

- **Sleep 모드**: 15분간 요청이 없으면 서비스가 sleep 상태로 전환
- **첫 요청 지연**: Sleep 상태에서 첫 요청 시 깨어나는 데 시간 소요
- **빌드 시간**: 무료 플랜은 빌드 시간이 제한될 수 있음

### URL 구조

- **프론트엔드**: `https://coffee-order-app.onrender.com`
- **백엔드 API**: `https://coffee-order-api.onrender.com/api`
- **CORS_ORIGIN**: 프론트엔드 URL (슬래시 없이)

---

## 🔄 업데이트 배포

코드 변경 후 자동 배포:
- GitHub에 푸시하면 Render가 자동으로 재배포
- 배포 로그에서 진행 상황 확인 가능

수동 재배포:
1. Render 대시보드에서 프론트엔드 서비스 선택
2. "Manual Deploy" → "Deploy latest commit" 클릭

환경 변수 변경:
1. Environment Variables 수정
2. "Save Changes" 클릭
3. 자동으로 재배포됨
