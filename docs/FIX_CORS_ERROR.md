# CORS 에러 해결 가이드

## 🔴 현재 문제

로그에 다음 에러가 표시되고 있습니다:
```
에러 발생: Error: CORS 정책에 의해 차단되었습니다.
```

## 🔍 원인 분석

CORS 에러가 발생하는 주요 원인:
1. 백엔드의 `CORS_ORIGIN` 환경 변수가 프론트엔드 URL과 일치하지 않음
2. 프론트엔드가 아직 배포되지 않았거나 URL이 잘못됨
3. CORS 설정 로직에 문제가 있음

## ✅ 해결 방법

### 방법 1: CORS_ORIGIN 환경 변수 확인 및 수정

1. **백엔드 서비스 페이지로 이동**
   - Render 대시보드에서 `order-app-backend` 서비스 선택

2. **Environment 탭 클릭**
   - 왼쪽 사이드바에서 "Environment" 선택

3. **CORS_ORIGIN 환경 변수 확인**
   - `CORS_ORIGIN` 변수를 찾습니다
   - 현재 값 확인

4. **올바른 값으로 수정**
   - 프론트엔드가 배포되었다면:
     ```
     https://coffee-order-app.onrender.com
     ```
   - 프론트엔드가 아직 배포되지 않았다면:
     ```
     http://localhost:5173
     ```
   - 또는 여러 도메인 허용:
     ```
     https://coffee-order-app.onrender.com,http://localhost:5173
     ```

5. **저장**
   - "Save Changes" 클릭
   - 자동으로 재배포됩니다

### 방법 2: CORS 설정 코드 확인

현재 `server.js`의 CORS 설정을 확인하고 필요시 수정:

```javascript
// 여러 origin 허용하도록 수정
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없거나 (같은 도메인 요청) 허용된 origin 목록에 있으면 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true
}));
```

### 방법 3: 개발 환경에서 테스트하는 경우

로컬에서 프론트엔드를 실행하여 Render 백엔드를 테스트하는 경우:

1. **CORS_ORIGIN에 로컬 URL 추가**
   ```
   http://localhost:5173,https://coffee-order-app.onrender.com
   ```

2. **또는 임시로 모든 origin 허용** (개발용만)
   - Environment Variables에서:
     ```
     CORS_ORIGIN=*
     ```
   - ⚠️ **주의**: 프로덕션에서는 사용하지 마세요!

## 📝 체크리스트

- [ ] 프론트엔드 배포 완료 여부 확인
- [ ] 프론트엔드 URL 확인
- [ ] 백엔드 Environment Variables에서 `CORS_ORIGIN` 확인
- [ ] `CORS_ORIGIN` 값을 프론트엔드 URL로 설정
- [ ] URL 끝에 슬래시(`/`) 없는지 확인
- [ ] 변경사항 저장 후 재배포 확인

## 🔧 빠른 해결

1. **백엔드 서비스** → **Environment** 탭
2. **CORS_ORIGIN** 찾기
3. **Value를 프론트엔드 URL로 변경**:
   ```
   https://coffee-order-app.onrender.com
   ```
4. **Save Changes** 클릭
5. 재배포 완료 후 로그 확인

## 💡 참고사항

- CORS 에러는 브라우저의 보안 정책 때문입니다
- 백엔드에서 명시적으로 허용한 origin만 접근 가능합니다
- 환경 변수 변경 후 자동 재배포가 시작됩니다
- 재배포 완료까지 1-2분 소요될 수 있습니다
