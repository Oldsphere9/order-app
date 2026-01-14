# Render.com 환경 변수 추가 방법

## 🔍 환경 변수 추가 방법

### 방법 1: Environment Variables 테이블에서 직접 추가

1. **Environment 탭 열기**
   - 백엔드 서비스 → 왼쪽 사이드바에서 "Environment" 클릭

2. **Environment Variables 섹션 확인**
   - "Environment Variables" 제목 아래에 테이블이 보입니다
   - KEY와 VALUE 컬럼이 있는 테이블

3. **새 행 추가**
   - 테이블의 빈 행을 찾거나
   - 테이블 아래에 "+" 아이콘 또는 "Add" 버튼이 있을 수 있습니다
   - 또는 테이블 상단의 "Edit" 버튼을 클릭하면 편집 모드로 전환됩니다

4. **Edit 모드 사용**
   - "Export" 옆의 "Edit" 버튼 클릭
   - 편집 모드로 전환되면 새 행 추가 가능

### 방법 2: Settings 탭에서 추가

1. **Settings 탭 열기**
   - 왼쪽 사이드바에서 "Settings" 클릭

2. **Environment Variables 섹션 찾기**
   - Settings 페이지에서 "Environment Variables" 섹션 찾기
   - 여기서 추가/수정 가능할 수 있습니다

### 방법 3: 데이터베이스 연결 (자동 DATABASE_URL 추가)

1. **데이터베이스 서비스 페이지로 이동**
   - `order-app-db` 데이터베이스 선택

2. **"Connect" 버튼 확인**
   - 데이터베이스 Info 페이지 우측 상단에 "Connect" 버튼이 있습니다
   - 이 버튼을 클릭하면 연결 방법이 표시됩니다

3. **또는 데이터베이스의 "Apps" 탭 확인**
   - 데이터베이스 서비스 → 왼쪽 사이드바에서 "Apps" 클릭
   - 여기서 연결된 앱을 확인하고 새 앱을 연결할 수 있습니다

## 📝 DATABASE_URL 수동 추가 가이드

### 1단계: Internal Database URL 확인

1. **데이터베이스 서비스** (`order-app-db`) 선택
2. **"Connections" 탭** 클릭
   - 왼쪽 사이드바 또는 상단 탭에서 찾기
3. **"Internal Database URL"** 복사
   - 전체 URL 복사 (예: `postgresql://user:password@host:5432/dbname`)

### 2단계: 백엔드 서비스에 환경 변수 추가

1. **백엔드 서비스** (`order-app-backend`) → **Environment 탭**
2. **Environment Variables 테이블 확인**
3. **편집 방법 시도:**
   - 테이블 상단의 **"Edit"** 버튼 클릭
   - 또는 테이블 내부를 클릭하여 편집 모드 활성화
   - 새 행 추가 또는 기존 행 수정

4. **DATABASE_URL 추가:**
   - KEY: `DATABASE_URL`
   - VALUE: 복사한 Internal Database URL 붙여넣기

5. **저장**
   - "Save" 또는 "Save Changes" 버튼 클릭

## 🔧 대안: Shell을 통한 확인

만약 UI에서 추가가 어렵다면:

1. **백엔드 서비스** → **Shell 탭** 클릭
2. **환경 변수 확인:**
   ```bash
   echo $DATABASE_URL
   ```
3. **환경 변수가 없다면**, Render 지원팀에 문의하거나
   - Settings → "Contact support" 사용

## 💡 팁

- **Edit 버튼**: Environment Variables 섹션 상단 우측에 "Edit" 버튼이 있습니다
- **키보드 단축키**: 일부 Render UI에서는 Enter 키로 새 행 추가 가능
- **브라우저 새로고침**: 페이지를 새로고침하면 UI가 업데이트될 수 있습니다
