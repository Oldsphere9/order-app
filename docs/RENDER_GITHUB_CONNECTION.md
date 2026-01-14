# Render.com GitHub 연결 문제 해결

## 문제 상황
Web Service 생성 화면에서 "GitHub" 버튼을 클릭하면 Overview 화면으로 이동하는 경우

## 원인
- GitHub 계정이 Render에 연결되지 않음
- GitHub 인증이 만료됨
- 저장소 접근 권한 문제

## 해결 방법

### 방법 1: GitHub 계정 연결 확인 및 재연결

1. **Render 대시보드에서 GitHub 연결 확인**
   - Render 대시보드 우측 상단 프로필 아이콘 클릭
   - "Account Settings" 또는 "Settings" 선택
   - "Integrations" 또는 "Git Providers" 섹션 확인
   - GitHub가 연결되어 있는지 확인

2. **GitHub 연결이 없는 경우**
   - "Connect GitHub" 또는 "Add GitHub" 버튼 클릭
   - GitHub 인증 진행
   - Render가 요청하는 권한 승인:
     - Repository access
     - Webhook access

3. **연결 후 다시 시도**
   - "New +" → "Web Service" 선택
   - "GitHub" 버튼 클릭
   - 이제 저장소 목록이 표시되어야 합니다

### 방법 2: Public Git Repository 사용

GitHub 연결이 계속 실패하는 경우, Public Git Repository 옵션을 사용할 수 있습니다:

1. **"Public Git Repository" 탭 선택**
   - Web Service 생성 화면에서 "Public Git Repository" 탭 클릭

2. **저장소 URL 입력**
   ```
   https://github.com/Oldsphere9/order-app.git
   ```

3. **나머지 설정 진행**
   - Name, Branch, Root Directory 등 설정

### 방법 3: GitHub OAuth 재인증

1. **Render Settings에서 GitHub 연결 해제**
   - Settings → Integrations → GitHub
   - "Disconnect" 또는 "Remove" 클릭

2. **다시 연결**
   - "Connect GitHub" 클릭
   - GitHub 로그인 및 권한 승인

3. **권한 확인**
   - GitHub에서 Settings → Applications → Authorized OAuth Apps
   - Render 앱이 승인되어 있는지 확인
   - 필요시 권한 재승인

### 방법 4: 저장소가 Private인 경우

저장소가 Private인 경우:

1. **GitHub에서 저장소 설정 확인**
   - 저장소가 Private인지 확인
   - Render가 Private 저장소에 접근할 권한이 있는지 확인

2. **저장소를 Public으로 변경 (임시)**
   - GitHub 저장소 Settings → Danger Zone
   - "Change visibility" → "Make public"
   - 배포 후 다시 Private으로 변경 가능

3. **또는 GitHub Personal Access Token 사용**
   - GitHub → Settings → Developer settings → Personal access tokens
   - "Generate new token (classic)" 클릭
   - `repo` 권한 선택
   - 토큰 생성 후 Public Git Repository 옵션에서 사용

## 권장 해결 순서

1. ✅ Render Settings에서 GitHub 연결 상태 확인
2. ✅ GitHub 연결이 없다면 연결 시도
3. ✅ 연결이 되어 있다면 재연결 시도
4. ✅ 그래도 안 되면 Public Git Repository 옵션 사용

## 추가 확인사항

- GitHub 계정이 활성화되어 있는지 확인
- Render와 GitHub가 같은 이메일로 가입되어 있는지 확인 (선택사항)
- 브라우저 쿠키/캐시 문제일 수 있으므로 시크릿 모드에서 시도
