# 프론트엔드 코드 리뷰 보고서

## 📋 개요
커피빈 메뉴 주문 앱의 프론트엔드 코드를 시니어 프론트엔드 개발자 관점에서 분석한 결과입니다.

---

## 🔴 1. 코드 품질 문제

### 문제 1-1: 중복된 메뉴 타입 체크 로직

**발견된 문제:**
- 메뉴 타입 체크 로직(`isIceMenu`, `isDessertMenu`, `shouldHideTemperature`)이 4개 컴포넌트에 중복됨
  - `OrderPage.jsx` (28-35줄)
  - `OrderSidebar.jsx` (154-160줄)
  - `OptionModal.jsx` (6-13줄)
  - `StatusPage.jsx` (96-102줄)
- DRY 원칙 위반, 유지보수 어려움

**개선 제안:**
- 공통 유틸리티 함수로 분리하여 재사용성 향상
- 비즈니스 로직 변경 시 한 곳만 수정하면 됨

**수정된 코드:**

```javascript
// ui/src/utils/menuUtils.js (새 파일 생성)
export const MENU_TYPES = {
  ICE_KEYWORDS: ['아이스', '스무디', '설향', '스파클링'],
  DESSERT_CATEGORY: '디저트'
};

export const isIceMenu = (menuName) => {
  if (!menuName) return false;
  return MENU_TYPES.ICE_KEYWORDS.some(keyword => menuName.includes(keyword));
};

export const isDessertMenu = (category) => {
  return category === MENU_TYPES.DESSERT_CATEGORY;
};

export const shouldHideTemperature = (menuName) => {
  return isIceMenu(menuName);
};

export const getDefaultOptions = (menu) => {
  const hideTemp = shouldHideTemperature(menu?.name);
  const isDessert = isDessertMenu(menu?.category);
  
  return {
    temperature: hideTemp ? 'ICE' : 'HOT',
    size: 'Regular',
    shot: '기본',
    extra: '',
    isDessert
  };
};
```

---

### 문제 1-2: 하드코딩된 옵션 가격

**발견된 문제:**
- 옵션 가격이 `OptionModal.jsx`에 하드코딩됨 (45-55줄)
- 가격 정책 변경 시 여러 곳 수정 필요
- 백엔드와 프론트엔드 가격 불일치 가능성

**개선 제안:**
- 옵션 가격을 상수로 분리하거나 백엔드에서 조회
- 가격 정책을 중앙에서 관리

**수정된 코드:**

```javascript
// ui/src/utils/optionPricing.js (새 파일 생성)
export const OPTION_PRICES = {
  SIZE: {
    Small: -500,
    Regular: 0,
    Large: 500
  },
  SHOT: {
    기본: 0,
    '+1샷': 500,
    '+2샷': 1000
  },
  EXTRA: {
    '': 0,
    '휘핑크림 추가': 500,
    '시럽 추가': 500
  }
};

export const calculateOptionPrice = (basePrice, options, isDessert = false) => {
  if (isDessert) {
    return basePrice;
  }
  
  let price = basePrice;
  
  // 사이즈 가격 조정
  price += OPTION_PRICES.SIZE[options.size] || 0;
  
  // 샷 추가 가격 조정
  price += OPTION_PRICES.SHOT[options.shot] || 0;
  
  // 추가 옵션 가격 조정
  price += OPTION_PRICES.EXTRA[options.extra] || 0;
  
  return price;
};
```

---

### 문제 1-3: OptionModal의 calculatePrice 중복 호출

**발견된 문제:**
- `handleConfirm`에서 `calculatePrice()`가 두 번 호출됨 (65-66줄)
- 불필요한 계산 중복

**개선 제안:**
- 한 번만 계산하여 변수에 저장

**수정된 코드:**

```javascript
// OptionModal.jsx의 handleConfirm 함수
const handleConfirm = () => {
  const calculatedPrice = calculatePrice();
  onConfirm({
    menu,
    options,
    quantity: 1,
    unitPrice: calculatedPrice,
    totalPrice: calculatedPrice
  });
  onClose();
};
```

---

### 문제 1-4: alert 사용으로 인한 사용자 경험 저하

**발견된 문제:**
- `OrderPage.jsx`와 `StatusPage.jsx`에서 `alert()` 사용 (76, 80, 84, 88, 114, 122, 126, 179줄)
- 브라우저 기본 alert는 사용자 경험 저하
- 에러 메시지가 일관성 없음

**개선 제안:**
- 토스트 메시지나 커스텀 모달로 대체
- 에러 타입별 일관된 메시지 표시

**수정된 코드:**

```javascript
// ui/src/utils/toast.js (새 파일 생성)
export const showToast = (message, type = 'info') => {
  // 간단한 토스트 구현 (react-toastify 등 라이브러리 사용 권장)
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196F3'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

// OrderPage.jsx에서 사용
import { showToast } from '../utils/toast';

const handleSubmit = async () => {
  if (!selectedTeam) {
    showToast('팀을 선택해주세요.', 'error');
    return;
  }
  // ... 나머지 검증
  
  try {
    const response = await orderAPI.createOrder(orderData);
    if (response.success) {
      showToast('주문이 완료되었습니다!', 'success');
      // ...
    }
  } catch (error) {
    showToast(errorMessage, 'error');
  }
};
```

---

## 🐛 2. 잠재적 버그

### 문제 2-1: 장바구니 아이템 키 생성 방식

**발견된 문제:**
- `OrderSidebar.jsx` 163줄: `key={${item.menu.id}-${index}-${JSON.stringify(item.options)}}`
- `JSON.stringify`는 성능 문제와 키 불안정성 야기
- 동일한 메뉴+옵션 조합이 여러 번 추가될 수 있음

**개선 제안:**
- 안정적인 고유 키 생성 함수 사용
- 동일 메뉴+옵션 조합 감지 및 병합 로직 추가

**수정된 코드:**

```javascript
// ui/src/utils/cartUtils.js (새 파일 생성)
export const generateCartItemKey = (menuId, options) => {
  const optionsKey = [
    options.temperature,
    options.size,
    options.shot,
    options.extra
  ].filter(Boolean).join('|');
  return `${menuId}_${optionsKey}`;
};

export const findExistingCartItem = (cart, menuId, options) => {
  const key = generateCartItemKey(menuId, options);
  return cart.find(item => {
    const itemKey = generateCartItemKey(item.menu.id, item.options);
    return itemKey === key;
  });
};

// OrderPage.jsx
import { findExistingCartItem } from '../utils/cartUtils';

const handleOptionConfirm = (menuItem) => {
  const existingItem = findExistingCartItem(selectedMenus, menuItem.menu.id, menuItem.options);
  
  if (existingItem) {
    // 동일한 메뉴+옵션이 있으면 수량만 증가
    const index = selectedMenus.indexOf(existingItem);
    handleQuantityChange(index, 1);
  } else {
    // 새로운 아이템 추가
    setSelectedMenus([...selectedMenus, menuItem]);
  }
  
  setIsModalOpen(false);
  setSelectedMenu(null);
};

// OrderSidebar.jsx
import { generateCartItemKey } from '../utils/cartUtils';

{selectedMenus.map((item, index) => {
  const itemKey = generateCartItemKey(item.menu.id, item.options);
  return (
    <div key={itemKey} className="menu-item">
      {/* ... */}
    </div>
  );
})}
```

---

### 문제 2-2: 주문 제출 시 로딩 상태 없음

**발견된 문제:**
- `OrderPage.jsx`의 `handleSubmit`에서 로딩 상태가 없음
- 사용자가 중복 클릭 가능
- 주문 처리 중인지 알 수 없음

**개선 제안:**
- 로딩 상태 추가 및 버튼 비활성화

**수정된 코드:**

```javascript
// OrderPage.jsx
function OrderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ... 기존 state들

  const handleSubmit = async () => {
    // 입력 검증
    if (!selectedTeam) {
      showToast('팀을 선택해주세요.', 'error');
      return;
    }
    // ... 나머지 검증

    if (isSubmitting) return; // 중복 제출 방지

    try {
      setIsSubmitting(true);
      const response = await orderAPI.createOrder(orderData);
      
      if (response.success) {
        showToast('주문이 완료되었습니다!', 'success');
        window.dispatchEvent(new Event('orderUpdated'));
        
        // 주문 후 초기화
        setSelectedMenus([]);
        setSelectedTeam('');
        setName('');
        setEmployeeId('');
      }
    } catch (error) {
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ...
    <OrderSidebar
      // ...
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}

// OrderSidebar.jsx
function OrderSidebar({ 
  // ...
  isSubmitting,
  onSubmit
}) {
  const isFormValid = selectedTeam && name && employeeId && selectedMenus.length > 0 && !isSubmitting;

  return (
    // ...
    <button
      className="submit-button"
      disabled={!isFormValid}
      onClick={onSubmit}
    >
      {isSubmitting ? '주문 처리 중...' : '주문하기'}
    </button>
  );
}
```

---

### 문제 2-3: OptionModal의 menu null 체크 부족

**발견된 문제:**
- `OptionModal.jsx` 75줄: `menu.name`에 직접 접근
- `menu`가 null이거나 undefined일 때 에러 발생 가능

**개선 제안:**
- Early return 또는 안전한 접근 패턴 사용

**수정된 코드:**

```javascript
// OptionModal.jsx
function OptionModal({ menu, isOpen, onClose, onConfirm }) {
  if (!isOpen || !menu) return null; // Early return

  // ... 나머지 코드
}
```

---

### 문제 2-4: 메뉴 필터링 로직의 성능 문제

**발견된 문제:**
- `MenuSelection.jsx` 55-57줄: 매 렌더링마다 필터링 수행
- `useMemo`로 최적화되지 않음

**개선 제안:**
- `useMemo`로 필터링 결과 메모이제이션

**수정된 코드:**

```javascript
// MenuSelection.jsx
import { useMemo } from 'react';

function MenuSelection({ onMenuSelect }) {
  // ... 기존 코드

  const filteredMenus = useMemo(() => {
    if (selectedCategory === '전체') {
      return menus;
    }
    return menus.filter(menu => menu.category === selectedCategory);
  }, [menus, selectedCategory]);

  return (
    // ...
    {filteredMenus.map(menu => (
      // ...
    ))}
  );
}
```

---

## 🏗️ 3. 구조 개선

### 문제 3-1: OrderPage 컴포넌트가 너무 비대함

**발견된 문제:**
- `OrderPage.jsx`가 주문 로직, 상태 관리, 이벤트 핸들링을 모두 담당
- 단일 책임 원칙 위반
- 테스트 어려움

**개선 제안:**
- 커스텀 훅으로 주문 로직 분리
- 상태 관리와 비즈니스 로직 분리

**수정된 코드:**

```javascript
// ui/src/hooks/useOrder.js (새 파일 생성)
import { useState } from 'react';
import { orderAPI } from '../utils/api';
import { teams } from '../data/menuData';
import { findExistingCartItem } from '../utils/cartUtils';
import { showToast } from '../utils/toast';

export const useOrder = () => {
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMenuToCart = (menuItem) => {
    const existingItem = findExistingCartItem(selectedMenus, menuItem.menu.id, menuItem.options);
    
    if (existingItem) {
      const index = selectedMenus.indexOf(existingItem);
      updateQuantity(index, 1);
    } else {
      setSelectedMenus([...selectedMenus, menuItem]);
    }
  };

  const removeMenu = (index) => {
    setSelectedMenus(selectedMenus.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, change) => {
    const updatedMenus = [...selectedMenus];
    const menu = updatedMenus[index];
    const newQuantity = Math.max(1, menu.quantity + change);
    updatedMenus[index] = {
      ...menu,
      quantity: newQuantity,
      totalPrice: menu.unitPrice * newQuantity
    };
    setSelectedMenus(updatedMenus);
  };

  const submitOrder = async () => {
    // 입력 검증
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
    if (selectedMenus.length === 0) {
      showToast('메뉴를 선택해주세요.', 'error');
      return false;
    }

    if (isSubmitting) return false;

    const team = teams.find(t => t.id.toString() === selectedTeam);
    const teamName = team ? team.name : selectedTeam;

    const orderData = {
      team: teamName,
      name: name.trim(),
      employee_id: employeeId.trim(),
      menus: selectedMenus.map(item => ({
        menu_id: item.menu.id,
        quantity: item.quantity,
        options: item.options
      }))
    };

    try {
      setIsSubmitting(true);
      const response = await orderAPI.createOrder(orderData);
      
      if (response.success) {
        showToast('주문이 완료되었습니다!', 'success');
        window.dispatchEvent(new Event('orderUpdated'));
        
        // 주문 후 초기화
        resetOrder();
        return true;
      } else {
        showToast(response.error || '주문 저장에 실패했습니다.', 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || '주문 저장에 실패했습니다. 다시 시도해주세요.';
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setSelectedMenus([]);
    setSelectedTeam('');
    setName('');
    setEmployeeId('');
  };

  const totalPrice = selectedMenus.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    selectedMenus,
    selectedTeam,
    name,
    employeeId,
    isSubmitting,
    totalPrice,
    setSelectedTeam,
    setName,
    setEmployeeId,
    addMenuToCart,
    removeMenu,
    updateQuantity,
    submitOrder
  };
};

// OrderPage.jsx (간소화)
import { useState } from 'react';
import MenuSelection from '../components/MenuSelection';
import OrderSidebar from '../components/OrderSidebar';
import OptionModal from '../components/OptionModal';
import { useOrder } from '../hooks/useOrder';
import { getDefaultOptions } from '../utils/menuUtils';
import './OrderPage.css';

function OrderPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  
  const {
    selectedMenus,
    selectedTeam,
    name,
    employeeId,
    isSubmitting,
    totalPrice,
    setSelectedTeam,
    setName,
    setEmployeeId,
    addMenuToCart,
    removeMenu,
    updateQuantity,
    submitOrder
  } = useOrder();

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleOptionConfirm = (menuItem) => {
    addMenuToCart(menuItem);
    setIsModalOpen(false);
    setSelectedMenu(null);
  };

  const handleRecommendationClick = (menu) => {
    const defaultOptions = getDefaultOptions(menu);
    const menuItem = {
      menu,
      options: {
        temperature: defaultOptions.temperature,
        size: defaultOptions.size,
        shot: defaultOptions.shot,
        extra: defaultOptions.extra
      },
      quantity: 1,
      unitPrice: menu.base_price,
      totalPrice: menu.base_price
    };
    addMenuToCart(menuItem);
  };

  return (
    <div className="order-page">
      <div className="order-content">
        <MenuSelection onMenuSelect={handleMenuSelect} />
        <OrderSidebar
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          name={name}
          onNameChange={setName}
          employeeId={employeeId}
          onEmployeeIdChange={setEmployeeId}
          selectedMenus={selectedMenus}
          onRemoveMenu={removeMenu}
          onQuantityChange={updateQuantity}
          totalPrice={totalPrice}
          isSubmitting={isSubmitting}
          onSubmit={submitOrder}
          onRecommendationClick={handleRecommendationClick}
        />
      </div>
      {selectedMenu && (
        <OptionModal
          menu={selectedMenu}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMenu(null);
          }}
          onConfirm={handleOptionConfirm}
        />
      )}
    </div>
  );
}

export default OrderPage;
```

---

### 문제 3-2: 추천 메뉴 조회 로직 분리 필요

**발견된 문제:**
- `OrderSidebar.jsx`에 추천 메뉴 조회 로직이 포함됨 (32-65줄)
- 컴포넌트가 너무 많은 책임을 가짐

**개선 제안:**
- 커스텀 훅으로 분리

**수정된 코드:**

```javascript
// ui/src/hooks/useRecommendations.js (새 파일 생성)
import { useState, useEffect } from 'react';
import { memberAPI } from '../utils/api';
import { teams } from '../data/menuData';

export const useRecommendations = (selectedTeam, name, employeeId) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!selectedTeam || !name || !employeeId) {
        setRecommendations([]);
        return;
      }

      const team = teams.find(t => t.id.toString() === selectedTeam);
      const teamName = team ? team.name : selectedTeam;

      try {
        setLoading(true);
        const data = await memberAPI.getRecommendations({
          team: teamName,
          name: name.trim(),
          employee_id: employeeId.trim(),
          limit: 1
        });
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('추천 메뉴 조회 실패:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedTeam, name, employeeId]);

  return { recommendations, loading };
};

// OrderSidebar.jsx
import { useRecommendations } from '../hooks/useRecommendations';

function OrderSidebar({ 
  selectedTeam, 
  onTeamChange, 
  name, 
  onNameChange, 
  employeeId, 
  onEmployeeIdChange,
  selectedMenus,
  onRemoveMenu,
  onQuantityChange,
  totalPrice,
  onSubmit,
  onRecommendationClick
}) {
  const isFormValid = selectedTeam && name && employeeId && selectedMenus.length > 0;
  const { recommendations, loading: loadingRecommendations } = useRecommendations(selectedTeam, name, employeeId);

  // ... 나머지 코드
}
```

---

### 문제 3-3: 옵션 표시 로직 중복

**발견된 문제:**
- 옵션을 문자열로 변환하는 로직이 여러 곳에 중복
- `OrderSidebar.jsx`, `StatusPage.jsx`, `MemberOrderCard.jsx`에 유사한 로직

**개선 제안:**
- 유틸리티 함수로 분리

**수정된 코드:**

```javascript
// ui/src/utils/optionUtils.js (새 파일 생성)
import { shouldHideTemperature, isDessertMenu } from './menuUtils';

export const formatOptions = (options, menu) => {
  if (!options || !menu) return '기본 옵션';
  
  const isDessert = isDessertMenu(menu.category);
  if (isDessert) {
    return '옵션 없음';
  }

  const hideTemp = shouldHideTemperature(menu.name);
  const optionsArray = [
    hideTemp ? null : options.temperature,
    options.size,
    options.shot,
    options.extra
  ].filter(Boolean);

  return optionsArray.length > 0 ? optionsArray.join(', ') : '기본 옵션';
};
```

---

## 📊 종합 개선 우선순위

### 🔴 높은 우선순위 (즉시 수정 권장)
1. **중복 제출 방지** - 로딩 상태 추가
2. **장바구니 키 생성** - 안정적인 키 생성 및 중복 아이템 병합
3. **에러 처리 개선** - alert 대신 토스트 메시지

### 🟡 중간 우선순위 (점진적 개선)
4. **중복 로직 제거** - 메뉴 타입 체크, 옵션 포맷팅 유틸리티화
5. **커스텀 훅 분리** - useOrder, useRecommendations
6. **성능 최적화** - useMemo 적용

### 🟢 낮은 우선순위 (리팩토링)
7. **상수 분리** - 옵션 가격, 메뉴 타입 상수화
8. **컴포넌트 분리** - 큰 컴포넌트를 더 작은 단위로 분리

---

## ✅ 권장 사항

1. **테스트 코드 작성**: 주요 비즈니스 로직에 대한 단위 테스트 추가
2. **타입 안정성**: TypeScript 도입 고려
3. **에러 바운더리**: React Error Boundary 추가
4. **접근성**: ARIA 라벨 및 키보드 네비게이션 개선
5. **성능 모니터링**: React DevTools Profiler로 성능 측정
