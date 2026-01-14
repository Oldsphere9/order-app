# 프론트엔드 코드 리뷰 보고서 (v3)

## 📋 리뷰 기준
1. 코드 품질: 가독성, 복잡도, Clean Code 원칙
2. 잠재적 버그: 엣지 케이스, 예외 처리
3. 구조 개선: 컴포넌트 분리, 재사용성

---

## 🔴 높은 우선순위 문제

### 문제 1: OptionModal의 options 상태 업데이트가 함수형이 아님

**발견된 문제:**
- `OptionModal`에서 `setOptions`를 호출할 때 스프레드 연산자만 사용
- 여러 옵션 버튼을 빠르게 클릭하면 상태 업데이트가 누락될 수 있음
- React의 상태 업데이트 배칭으로 인한 경쟁 조건 가능

**개선 제안:**
- 함수형 업데이트를 사용하여 항상 최신 상태를 기반으로 업데이트
- 옵션 변경 핸들러를 `useCallback`으로 메모이제이션

**수정된 코드:**
```jsx
// ui/src/components/OptionModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { shouldHideTemperature, isDessertMenu, getDefaultOptions } from '../utils/menuUtils';
import { calculateOptionPrice } from '../utils/optionPricing';
import './OptionModal.css';

function OptionModal({ menu, isOpen, onClose, onConfirm }) {
  if (!isOpen || !menu) return null;

  const hideTemp = shouldHideTemperature(menu.name);
  const isDessert = isDessertMenu(menu.category);
  
  const [options, setOptions] = useState({
    temperature: 'HOT',
    size: 'Regular',
    shot: '기본',
    extra: ''
  });

  // 메뉴가 변경될 때 옵션 초기화
  useEffect(() => {
    if (menu) {
      const defaultOpts = getDefaultOptions(menu);
      setOptions({
        temperature: defaultOpts.temperature,
        size: defaultOpts.size,
        shot: defaultOpts.shot,
        extra: defaultOpts.extra
      });
    }
  }, [menu]);

  // 가격 계산을 useMemo로 최적화
  const calculatedPrice = useMemo(() => {
    const basePrice = menu.base_price || menu.basePrice || 0;
    return calculateOptionPrice(basePrice, options, isDessert);
  }, [menu.base_price, menu.basePrice, options, isDessert]);

  // 옵션 변경 핸들러들을 useCallback으로 메모이제이션
  const handleTemperatureChange = useCallback((temperature) => {
    setOptions(prev => ({ ...prev, temperature }));
  }, []);

  const handleSizeChange = useCallback((size) => {
    setOptions(prev => ({ ...prev, size }));
  }, []);

  const handleShotChange = useCallback((shot) => {
    setOptions(prev => ({ ...prev, shot }));
  }, []);

  const handleExtraChange = useCallback((extra) => {
    setOptions(prev => ({ ...prev, extra }));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm({
      menu,
      options,
      quantity: 1,
      unitPrice: calculatedPrice,
      totalPrice: calculatedPrice
    });
    onClose();
  }, [menu, options, calculatedPrice, onConfirm, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{menu.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!isDessert && (
            <>
              {!hideTemp && (
                <div className="option-group">
                  <label>온도</label>
                  <div className="option-buttons">
                    <button
                      className={`option-btn ${options.temperature === 'HOT' ? 'active' : ''}`}
                      onClick={() => handleTemperatureChange('HOT')}
                    >
                      HOT
                    </button>
                    <button
                      className={`option-btn ${options.temperature === 'ICE' ? 'active' : ''}`}
                      onClick={() => handleTemperatureChange('ICE')}
                    >
                      ICE
                    </button>
                  </div>
                </div>
              )}

              <div className="option-group">
                <label>사이즈</label>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${options.size === 'Small' ? 'active' : ''}`}
                    onClick={() => handleSizeChange('Small')}
                  >
                    Small (-500원)
                  </button>
                  <button
                    className={`option-btn ${options.size === 'Regular' ? 'active' : ''}`}
                    onClick={() => handleSizeChange('Regular')}
                  >
                    Regular
                  </button>
                  <button
                    className={`option-btn ${options.size === 'Large' ? 'active' : ''}`}
                    onClick={() => handleSizeChange('Large')}
                  >
                    Large (+500원)
                  </button>
                </div>
              </div>

              {menu.category === '커피' && (
                <div className="option-group">
                  <label>샷 추가</label>
                  <div className="option-buttons">
                    <button
                      className={`option-btn ${options.shot === '기본' ? 'active' : ''}`}
                      onClick={() => handleShotChange('기본')}
                    >
                      기본
                    </button>
                    <button
                      className={`option-btn ${options.shot === '+1샷' ? 'active' : ''}`}
                      onClick={() => handleShotChange('+1샷')}
                    >
                      +1샷 (+500원)
                    </button>
                    <button
                      className={`option-btn ${options.shot === '+2샷' ? 'active' : ''}`}
                      onClick={() => handleShotChange('+2샷')}
                    >
                      +2샷 (+1,000원)
                    </button>
                  </div>
                </div>
              )}

              <div className="option-group">
                <label>추가 옵션</label>
                <div className="option-buttons">
                  <button
                    className={`option-btn ${options.extra === '' ? 'active' : ''}`}
                    onClick={() => handleExtraChange('')}
                  >
                    없음
                  </button>
                  <button
                    className={`option-btn ${options.extra === '휘핑크림 추가' ? 'active' : ''}`}
                    onClick={() => handleExtraChange('휘핑크림 추가')}
                  >
                    휘핑크림 추가 (+500원)
                  </button>
                  <button
                    className={`option-btn ${options.extra === '시럽 추가' ? 'active' : ''}`}
                    onClick={() => handleExtraChange('시럽 추가')}
                  >
                    시럽 추가 (+500원)
                  </button>
                </div>
              </div>
            </>
          )}

          {isDessert && (
            <div className="no-options-message">
              <p>디저트 메뉴는 옵션 선택이 없습니다.</p>
            </div>
          )}

          <div className="price-preview">
            <span>예상 가격: </span>
            <span className="price-amount">{calculatedPrice.toLocaleString()}원</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>취소</button>
          <button className="confirm-button" onClick={handleConfirm}>추가하기</button>
        </div>
      </div>
    </div>
  );
}

export default OptionModal;
```

---

### 문제 2: MenuManagementPage의 loadMenus가 useCallback으로 메모이제이션되지 않음

**발견된 문제:**
- `loadMenus` 함수가 매 렌더링마다 새로 생성됨
- `useEffect`의 의존성 배열에 `loadMenus`가 없어 경고 발생 가능
- `handleStatusChange`에서 `updating` 상태 업데이트가 함수형이 아님

**개선 제안:**
- `loadMenus`를 `useCallback`으로 메모이제이션
- `handleStatusChange`의 상태 업데이트를 함수형으로 변경

**수정된 코드:**
```jsx
// ui/src/pages/MenuManagementPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { menuAPI } from '../utils/api';
import './MenuManagementPage.css';

function MenuManagementPage() {
  const [activeMenus, setActiveMenus] = useState([]);
  const [seasonOffMenus, setSeasonOffMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [activeTab, setActiveTab] = useState('season_off');

  const loadMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'season_off') {
        const data = await menuAPI.getMenus({ status: 'season_off' });
        setSeasonOffMenus(data);
      } else {
        const data = await menuAPI.getMenus({ status: 'active' });
        setActiveMenus(data);
      }
    } catch (err) {
      console.error('메뉴 로딩 실패:', err);
      setError('메뉴를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  const handleStatusChange = useCallback(async (menuId, newStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [menuId]: true }));
      await menuAPI.updateMenu(menuId, { sale_status: newStatus });
      
      // 목록 새로고침
      await loadMenus();
      
      const statusText = newStatus === 'active' ? '활성화' : 'Season Off';
      alert(`메뉴가 ${statusText} 상태로 변경되었습니다.`);
    } catch (err) {
      console.error('메뉴 상태 변경 실패:', err);
      const errorMessage = err.response?.data?.error || err.message || '메뉴 상태 변경에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setUpdating(prev => ({ ...prev, [menuId]: false }));
    }
  }, [loadMenus]);

  // ... 나머지 코드 동일
}
```

---

### 문제 3: StatusPage에서 window.confirm 사용 (UX 개선 필요)

**발견된 문제:**
- `window.confirm`은 브라우저 기본 다이얼로그로 UX가 좋지 않음
- 스타일링 불가능
- 접근성 문제

**개선 제안:**
- 커스텀 확인 모달 컴포넌트 생성
- 또는 기존 toast 시스템을 활용한 확인 다이얼로그

**수정된 코드:**
```jsx
// ui/src/components/ConfirmDialog.jsx (신규 생성)
import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = '확인', cancelText = '취소' }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="confirm-dialog-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
```

```jsx
// ui/src/pages/StatusPage.jsx 수정
import ConfirmDialog from '../components/ConfirmDialog';

function StatusPage() {
  // ... 기존 코드 ...
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleCloseOrders = async () => {
    setShowCloseConfirm(true);
  };

  const handleCloseConfirm = async () => {
    setShowCloseConfirm(false);
    try {
      const response = await orderAPI.closeOrders();
      showToast(`주문이 마감되었습니다. (${response.closed_orders_count}건 저장됨)`, 'success');
      setCanReset(true);
      loadData();
    } catch (error) {
      console.error('주문 마감 실패:', error);
      const errorMessage = error.response?.data?.error || error.message || '주문 마감에 실패했습니다.';
      showToast(errorMessage, 'error');
    }
  };

  const handleResetOrders = async () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    try {
      const response = await orderAPI.resetAllOrders();
      showToast(`모든 주문이 삭제되었습니다. (${response.deleted_orders_count}건 삭제됨)`, 'success');
      setCanReset(false);
      loadData();
    } catch (error) {
      console.error('주문 리셋 실패:', error);
      const errorMessage = error.response?.data?.error || error.message || '주문 리셋에 실패했습니다.';
      showToast(errorMessage, 'error');
      if (error.response?.data?.code === 'CLOSE_FIRST') {
        setCanReset(false);
      }
    }
  };

  return (
    <div className="status-page">
      {/* ... 기존 JSX ... */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="주문 마감"
        message="주문을 마감하시겠습니까? 주문 정보는 저장되고 주문 현황은 유지됩니다."
        onConfirm={handleCloseConfirm}
        onCancel={() => setShowCloseConfirm(false)}
        confirmText="마감하기"
        cancelText="취소"
      />
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="주문 리셋"
        message="모든 주문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        confirmText="삭제하기"
        cancelText="취소"
      />
    </div>
  );
}
```

---

### 문제 4: CartItem에서 key prop을 div에 사용

**발견된 문제:**
- `CartItem` 컴포넌트 내부의 `div`에 `key` prop 사용
- `key`는 리스트의 최상위 요소에만 사용해야 함
- 불필요한 prop 전달

**개선 제안:**
- `key` prop 제거 (이미 부모에서 설정됨)

**수정된 코드:**
```jsx
// ui/src/components/CartItem.jsx
// ... 기존 코드 ...

  return (
    <div className="menu-item"> {/* key prop 제거 */}
      <div className="menu-item-info">
        {/* ... 나머지 동일 ... */}
      </div>
      {/* ... 나머지 동일 ... */}
    </div>
  );
```

---

### 문제 5: useOrder의 validateOrder가 배열 길이만 체크

**발견된 문제:**
- `selectedMenus.length`만 체크하여 빈 배열이 아닌지만 확인
- 실제로 유효한 메뉴 객체가 있는지 확인하지 않음
- `item.menu`가 null이거나 undefined일 수 있음

**개선 제안:**
- 실제 유효한 메뉴가 있는지 확인
- 각 메뉴 아이템의 필수 필드 검증

**수정된 코드:**
```jsx
// ui/src/hooks/useOrder.js
const validateOrder = useCallback(() => {
  if (!selectedTeam) {
    showToast('팀을 선택해주세요.', 'error');
    return false;
  }
  if (!name || name.trim() === '') {
    showToast('이름을 입력해주세요.', 'error');
    return false;
  }
  if (!employeeId || employeeId.trim() === '') {
    showToast('사원번호를 입력해주세요.', 'error');
    return false;
  }
  
  // 유효한 메뉴가 있는지 확인
  const validMenus = selectedMenus.filter(item => 
    item && item.menu && item.menu.id && item.quantity > 0
  );
  
  if (validMenus.length === 0) {
    showToast('유효한 메뉴를 선택해주세요.', 'error');
    return false;
  }
  
  return true;
}, [selectedTeam, name, employeeId, selectedMenus]);
```

---

## 🟡 중간 우선순위 문제

### 문제 6: 에러 바운더리 부재

**발견된 문제:**
- React 에러 바운더리가 없어 컴포넌트 크래시 시 전체 앱이 다운됨
- 사용자에게 친화적인 에러 메시지 제공 불가

**개선 제안:**
- ErrorBoundary 컴포넌트 생성 및 적용

**수정된 코드:**
```jsx
// ui/src/components/ErrorBoundary.jsx (신규 생성)
import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('에러 발생:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>오류가 발생했습니다</h2>
          <p>앱을 새로고침해주세요.</p>
          <button onClick={this.handleReset}>새로고침</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

### 문제 7: MenuManagementPage에서 alert 사용

**발견된 문제:**
- `alert`는 브라우저 기본 다이얼로그로 UX가 좋지 않음
- toast 시스템이 있는데 사용하지 않음

**개선 제안:**
- `alert` 대신 `showToast` 사용

**수정된 코드:**
```jsx
// ui/src/pages/MenuManagementPage.jsx
import { showToast } from '../utils/toast';

const handleStatusChange = useCallback(async (menuId, newStatus) => {
  try {
    setUpdating(prev => ({ ...prev, [menuId]: true }));
    await menuAPI.updateMenu(menuId, { sale_status: newStatus });
    
    await loadMenus();
    
    const statusText = newStatus === 'active' ? '활성화' : 'Season Off';
    showToast(`메뉴가 ${statusText} 상태로 변경되었습니다.`, 'success');
  } catch (err) {
    console.error('메뉴 상태 변경 실패:', err);
    const errorMessage = err.response?.data?.error || err.message || '메뉴 상태 변경에 실패했습니다.';
    showToast(errorMessage, 'error');
  } finally {
    setUpdating(prev => ({ ...prev, [menuId]: false }));
  }
}, [loadMenus]);
```

---

### 문제 8: MemberOrderCard에서 window.confirm 사용

**발견된 문제:**
- `window.confirm` 사용으로 일관성 없는 UX

**개선 제안:**
- ConfirmDialog 컴포넌트 사용

---

## 🟢 낮은 우선순위 개선 사항

### 문제 9: 타입 안정성 부족

**개선 제안:**
- PropTypes 추가 또는 TypeScript 마이그레이션 고려

### 문제 10: 로딩 상태 관리 일관성

**개선 제안:**
- 로딩 상태를 통합 관리하는 커스텀 훅 생성 고려

---

## ✅ 잘 구현된 부분

1. **컴포넌트 분리**: MenuCard, CartItem 등이 잘 분리됨
2. **메모이제이션**: useMemo, useCallback 적절히 사용
3. **유틸리티 함수 분리**: menuUtils, optionPricing 등으로 로직 분리
4. **커스텀 훅**: useOrder, useRecommendations로 로직 분리

---

## 📊 우선순위별 수정 권장사항

### 즉시 수정 (높은 우선순위)
1. OptionModal의 함수형 상태 업데이트
2. MenuManagementPage의 useCallback 적용
3. CartItem의 key prop 제거
4. useOrder의 validateOrder 개선

### 단기 개선 (중간 우선순위)
5. window.confirm을 ConfirmDialog로 교체
6. alert를 showToast로 교체
7. ErrorBoundary 추가

### 장기 개선 (낮은 우선순위)
8. TypeScript 도입 고려
9. 테스트 코드 작성
10. 접근성 개선 (ARIA 속성 등)
