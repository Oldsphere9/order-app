# CORS 에러 디버깅 가이드

## 🔴 현재 문제

재배포 후에도 CORS 에러가 계속 발생하고 있습니다.

## 🔍 원인 분석

CORS 에러가 발생하는 주요 원인:

1. **실제 요청 Origin이 설정한 값과 일치하지 않음**
   - 프론트엔드 URL이 정확히 일치하지 않을 수 있음
   - http vs https 차이
   - 슬래시(/) 유무 차이
   - 포트 번호 차이

2. **환경 변수가 제대로 로드되지 않음**
   - Render에서 환경 변수가 설정되지 않았을 수 있음
   - 환경 변수 이름 오타

3. **프론트엔드가 아직 배포되지 않음**
   - 프론트엔드가 배포되지 않아 다른 origin에서 접근 시도

## ✅ 해결 방법

### 1단계: 디버깅 로그 확인

코드에 디버깅 로그를 추가했습니다. 재배포 후 로그에서 다음을 확인하세요:

1. **허용된 CORS Origins 로그**
   - `허용된 CORS Origins: [...]` 메시지 확인
   - 설정한 origin이 올바르게 로드되는지 확인

2. **요청 Origin 로그**
   - `요청 Origin: ...` 메시지 확인
   - 실제 요청이 어떤 origin에서 오는지 확인

3. **CORS 차단 로그**
   - `CORS 차단 - 요청 Origin: ...` 메시지 확인
   - 어떤 origin이 차단되었는지 확인

### 2단계: 환경 변수 재확인

Render 대시보드에서:

1. **Environment 탭 확인**
   - `CORS_ORIGIN` 환경 변수가 있는지 확인
   - 값이 정확한지 확인:
     ```
     https://coffee-order-app.onrender.com
     ```
   - ⚠️ **주의**: 
     - URL 끝에 슬래시(`/`) 없이 입력
     - `http://`가 아닌 `https://` 사용
     - 정확한 도메인명 확인

### 3단계: 프론트엔드 배포 확인

프론트엔드가 배포되어 있는지 확인:

1. **프론트엔드 URL 확인**
   - Render 대시보드에서 프론트엔드 서비스 확인
   - 실제 프론트엔드 URL 확인

2. **CORS_ORIGIN 업데이트**
   - 백엔드의 `CORS_ORIGIN`을 실제 프론트엔드 URL로 설정
   - 여러 도메인 허용 시 쉼표로 구분:
     ```
     https://coffee-order-app.onrender.com,http://localhost:5173
     ```

### 4단계: 임시 해결 (개발용)

프론트엔드가 아직 배포되지 않았거나 테스트 중이라면:

1. **로컬 프론트엔드 허용**
   - `CORS_ORIGIN`에 로컬 URL 추가:
     ```
     https://coffee-order-app.onrender.com,http://localhost:5173
     ```

2. **또는 모든 origin 허용** (임시, 개발용만)
   - 코드에서 임시로 모든 origin 허용:
   ```javascript
   app.use(cors({
     origin: true, // 모든 origin 허용 (개발용만!)
     credentials: true
   }));
   ```
   - ⚠️ **주의**: 프로덕션에서는 사용하지 마세요!

## 📝 체크리스트

- [ ] 코드에 디버깅 로그 추가 완료
- [ ] 재배포 완료
- [ ] 로그에서 "허용된 CORS Origins" 확인
- [ ] 로그에서 "요청 Origin" 확인
- [ ] 실제 요청 origin과 허용된 origin 비교
- [ ] CORS_ORIGIN 환경 변수 재확인
- [ ] 프론트엔드 배포 상태 확인
- [ ] 프론트엔드 URL과 CORS_ORIGIN 일치 확인

## 🔧 다음 단계

1. **코드 변경사항 커밋 및 푸시**
   ```bash
   git add server/src/server.js
   git commit -m "CORS 디버깅 로그 추가"
   git push
   ```

2. **Render 자동 재배포 대기**
   - GitHub 푸시 후 Render가 자동으로 재배포

3. **로그 확인**
   - 재배포 완료 후 Logs 탭에서 디버깅 로그 확인
   - 실제 요청 origin과 허용된 origin 비교

4. **문제 해결**
   - 로그를 기반으로 CORS_ORIGIN 환경 변수 수정
   - 또는 코드 수정
