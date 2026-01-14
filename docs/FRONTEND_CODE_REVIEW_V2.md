# 프론트엔드 코드 리뷰 보고서 (v2)

## 📋 개요
이전 리뷰 이후 개선된 코드를 다시 분석한 결과입니다. 추가로 발견된 문제점과 개선 사항을 정리했습니다.

---

## 🔴 1. 코드 품질 문제

### 문제 1-1: useOrder 훅의 클로저 문제

**발견된 문제:**
- `useOrder.js` 32줄: `addMenuToCart` 내부에서 `updateQuantity`를 호출
- `updateQuantity`가 `selectedMenus`에 의존하는데, 클로저로 인해 최신 상태를 참조하지 못할 수 있음
- 함수형 업데이트를 사용하지 않아 상태 동기화 문제 가능

**개선 제안:**
- `updateQuantity`를 함수형 업데이트로 변경하거나
- `useCallback`으로 메모이제이션하여 최신 상태 보장

**수정된 코드:**

```javascript
// ui/src/hooks/useOrder.js
import { useState, useCallback, useMemo } from 'react';
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

  /**
   * 메뉴 수량 변경 (함수형 업데이트 사용)
   */
  const updateQuantity = useCallback((index, change) => {
    if (index < 0) return;
    
    setSelectedMenus(prevMenus => {
      if (index >= prevMenus.length) return prevMenus;
      
      const updatedMenus = [...prevMenus];
      const menu = updatedMenus[index];
      const newQuantity = Math.max(1, menu.quantity + change);
      
      updatedMenus[index] = {
        ...menu,
        quantity: newQuantity,
        totalPrice: menu.unitPrice * newQuantity
      };
      
      return updatedMenus;
    });
  }, []);

  /**
   * 장바구니에 메뉴 추가 (중복 체크 포함)
   */
  const addMenuToCart = useCallback((menuItem) => {
    if (!menuItem || !menuItem.menu) return;
    
    setSelectedMenus(prevMenus => {
      const existingItem = findExistingCartItem(
        prevMenus, 
        menuItem.menu.id, 
        menuItem.options
      );
      
      if (existingItem) {
        // 동일한 메뉴+옵션이 있으면 수량만 증가
        const index = prevMenus.indexOf(existingItem);
        if (index >= 0) {
          const updatedMenus = [...prevMenus];
          const menu = updatedMenus[index];
          updatedMenus[index] = {
            ...menu,
            quantity: menu.quantity + 1,
            totalPrice: menu.unitPrice * (menu.quantity + 1)
          };
          return updatedMenus;
        }
      }
      
      // 새로운 아이템 추가
      return [...prevMenus, menuItem];
    });
  }, []);

  /**
   * 장바구니에서 메뉴 제거
   */
  const removeMenu = useCallback((index) => {
    if (index < 0) return;
    setSelectedMenus(prevMenus => {
      if (index >= prevMenus.length) return prevMenus;
      return prevMenus.filter((_, i) => i !== index);
    });
  }, []);

  /**
   * 주문 입력 검증
   */
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
    if (selectedMenus.length === 0) {
      showToast('메뉴를 선택해주세요.', 'error');
      return false;
    }
    return true;
  }, [selectedTeam, name, employeeId, selectedMenus.length]);

  /**
   * 주문 제출
   */
  const submitOrder = useCallback(async () => {
    if (!validateOrder()) {
      return false;
    }

    if (isSubmitting) {
      showToast('주문 처리 중입니다. 잠시만 기다려주세요.', 'info');
      return false;
    }

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
        resetOrder();
        return true;
      } else {
        showToast(response.error || '주문 저장에 실패했습니다.', 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          '주문 저장에 실패했습니다. 다시 시도해주세요.';
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateOrder, isSubmitting, selectedTeam, name, employeeId, selectedMenus]);

  /**
   * 주문 폼 초기화
   */
  const resetOrder = useCallback(() => {
    setSelectedMenus([]);
    setSelectedTeam('');
    setName('');
    setEmployeeId('');
  }, []);

  // totalPrice를 useMemo로 최적화
  const totalPrice = useMemo(() => {
    return selectedMenus.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [selectedMenus]);

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
    submitOrder,
    resetOrder
  };
};
```

---

### 문제 1-2: OptionModal의 가격 계산 최적화 부족

**발견된 문제:**
- `OptionModal.jsx` 165-167줄: `calculatePrice()`가 매 렌더링마다 호출됨
- 옵션이 변경되지 않아도 가격이 재계산됨
- `useMemo`로 최적화 필요

**개선 제안:**
- `calculatePrice` 결과를 `useMemo`로 메모이제이션
- `options`와 `menu.base_price`가 변경될 때만 재계산

**수정된 코드:**

```javascript
// OptionModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  const handleConfirm = () => {
    onConfirm({
      menu,
      options,
      quantity: 1,
      unitPrice: calculatedPrice,
      totalPrice: calculatedPrice
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ... 기존 코드 ... */}
        
        <div className="price-preview">
          <span>예상 가격: </span>
          <span className="price-amount">{calculatedPrice.toLocaleString()}원</span>
        </div>
        
        {/* ... 기존 코드 ... */}
      </div>
    </div>
  );
}

export default OptionModal;
```

---

### 문제 1-3: StatusPage의 useEffect 의존성 경고

**발견된 문제:**
- `StatusPage.jsx` 22-33줄: `loadData`가 `useEffect` 내부에서 사용되지만 의존성 배열에 없음
- ESLint 경고 발생 가능
- `loadData`가 매 렌더링마다 새로 생성됨

**개선 제안:**
- `loadData`를 `useCallback`으로 메모이제이션
- 의존성 배열에 추가

**수정된 코드:**

```javascript
// StatusPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { orderAPI } from '../utils/api';
import StatsCards from '../components/StatsCards';
import TeamOrderCard from '../components/TeamOrderCard';
import MemberOrderCard from '../components/MemberOrderCard';
import { formatOptions } from '../utils/optionUtils';
import { showToast } from '../utils/toast';
import './StatusPage.css';

function StatusPage() {
  const [teamOrders, setTeamOrders] = useState([]);
  const [memberOrders, setMemberOrders] = useState([]);
  const [stats, setStats] = useState({
    totalQuantity: 0,
    teamCount: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('team');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 주문 목록과 통계를 동시에 조회
      const [ordersData, statsData] = await Promise.all([
        orderAPI.getOrders(),
        orderAPI.getOrderStats()
      ]);
      
      // 통계 설정
      setStats({
        totalQuantity: statsData.total_quantity || 0,
        teamCount: statsData.team_count || 0,
        totalAmount: statsData.total_amount || 0
      });
      
      // 주문 데이터 처리 (팀별로 그룹화 및 동일 옵션 메뉴별 집계)
      processOrders(ordersData);
      
      // 주문 인원별 데이터 처리
      processMemberOrders(ordersData);
    } catch (err) {
      console.error('데이터 로딩 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // 주문 페이지에서 주문이 완료되면 상태 업데이트를 위한 커스텀 이벤트
    const handleOrderUpdated = () => {
      loadData();
    };
    window.addEventListener('orderUpdated', handleOrderUpdated);
    
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdated);
    };
  }, [loadData]);

  // 화면이 포커스를 받을 때 데이터 갱신
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  // processOrders와 processMemberOrders도 useCallback으로 최적화
  const processOrders = useCallback((ordersData) => {
    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      setTeamOrders([]);
      return;
    }

    // ... 기존 로직 ...
  }, []);

  const processMemberOrders = useCallback((ordersData) => {
    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      setMemberOrders([]);
      return;
    }

    // ... 기존 로직 ...
  }, []);

  // ... 나머지 코드 ...
}

export default StatusPage;
```

---

## 🐛 2. 잠재적 버그

### 문제 2-1: OrderSidebar의 isFormValid 계산 최적화 부족

**발견된 문제:**
- `OrderSidebar.jsx` 23줄: `isFormValid`가 매 렌더링마다 계산됨
- `useMemo`로 최적화 가능

**개선 제안:**
- `useMemo`로 메모이제이션하여 불필요한 재계산 방지

**수정된 코드:**

```javascript
// OrderSidebar.jsx
import React, { useMemo } from 'react';
// ... 기존 imports ...

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
  isSubmitting = false,
  onSubmit,
  onRecommendationClick
}) {
  const { recommendations, loading: loadingRecommendations } = useRecommendations(selectedTeam, name, employeeId);

  // 팀 목록을 한글 순서로 정렬
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, []);

  // 폼 유효성 검사를 useMemo로 최적화
  const isFormValid = useMemo(() => {
    return selectedTeam && name && employeeId && selectedMenus.length > 0 && !isSubmitting;
  }, [selectedTeam, name, employeeId, selectedMenus.length, isSubmitting]);

  // ... 나머지 코드 ...
}
```

---

### 문제 2-2: MemberOrderCard의 window.confirm 사용

**발견된 문제:**
- `MemberOrderCard.jsx` 10줄: `window.confirm` 사용
- 브라우저 기본 다이얼로그는 UX가 좋지 않음
- 접근성 문제 (스크린 리더 지원 부족)

**개선 제안:**
- 커스텀 확인 모달 컴포넌트 생성
- 또는 `showToast`와 함께 확인 로직 개선

**수정된 코드:**

```javascript
// ui/src/components/MemberOrderCard.jsx
import React, { useState } from 'react';
import { formatOptions } from '../utils/optionUtils';
import { showToast } from '../utils/toast';
import './MemberOrderCard.css';

function MemberOrderCard({ member, orders, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!member || !orders) return null;

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onDelete(member.id);
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <div className="member-order-card">
        <div className="member-order-header">
          <div className="member-info">
            <span className="member-icon">👤</span>
            <div className="member-details">
              <div className="member-name">{member.name}</div>
              <div className="member-meta">
                <span className="member-id">사원번호: {member.employee_id}</span>
                <span className="member-team">팀: {member.team}</span>
              </div>
            </div>
          </div>
          <div className="member-order-footer">
            <button className="cancel-order-button" onClick={handleDeleteClick}>
              주문 취소
            </button>
          </div>
        </div>

        <div className="member-orders-list">
          {orders.map((order) => {
            if (!order || !order.menu) return null;
            
            const optionsText = formatOptions(order.options, order.menu);

            return (
              <div key={order.id} className="member-order-item">
                <span className="order-menu-name">{order.menu.name}</span>
                <span className="order-options">({optionsText})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirm && (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
          <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>주문 취소 확인</h3>
            <p>{member.name}님의 모든 주문을 취소하시겠습니까?</p>
            <div className="confirm-modal-buttons">
              <button className="confirm-btn" onClick={handleConfirm}>
                확인
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MemberOrderCard;
```

---

### 문제 2-3: API 에러 처리 개선 필요

**발견된 문제:**
- `api.js` 29-54줄: 에러 처리는 있지만 사용자 친화적이지 않음
- 네트워크 에러와 서버 에러를 구분하지 않음
- 재시도 로직 없음

**개선 제안:**
- 에러 타입별로 다른 메시지 표시
- 재시도 가능한 에러에 대한 처리 추가

**수정된 코드:**

```javascript
// ui/src/utils/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃 추가
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 에러 타입별 처리
    if (error.response) {
      // 서버에서 응답이 온 경우 (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('API 오류:', {
        status,
        data,
        url: error.config?.url
      });

      // 특정 상태 코드별 처리
      if (status === 401) {
        // 인증 에러
        console.error('인증이 필요합니다.');
      } else if (status === 403) {
        // 권한 에러
        console.error('접근 권한이 없습니다.');
      } else if (status === 404) {
        // 리소스 없음
        console.error('요청한 리소스를 찾을 수 없습니다.');
      } else if (status >= 500) {
        // 서버 에러
        console.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('서버에 연결할 수 없습니다.', {
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    } else {
      // 요청 설정 중 오류 발생
      console.error('요청 설정 오류:', error.message);
    }
    
    // Network Error인 경우 더 자세한 정보
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('네트워크 오류:', {
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    // Timeout 에러
    if (error.code === 'ECONNABORTED') {
      console.error('요청 시간이 초과되었습니다.');
    }
    
    return Promise.reject(error);
  }
);

// ... 기존 API 함수들 ...
```

---

### 문제 2-4: 토스트 메시지 큐 시스템 부재

**발견된 문제:**
- `toast.js`: 여러 토스트가 동시에 표시되면 겹칠 수 있음
- 큐 시스템이 없어 순차적 표시 불가

**개선 제안:**
- 토스트 큐 시스템 구현
- 또는 react-toastify 같은 라이브러리 사용

**수정된 코드:**

```javascript
// ui/src/utils/toast.js
// 향후 react-toastify 같은 라이브러리로 교체 권장

let toastQueue = [];
let isShowingToast = false;

const colors = {
  success: '#4caf50',
  error: '#f44336',
  info: '#2196F3',
  warning: '#ff9800'
};

const showNextToast = () => {
  if (toastQueue.length === 0 || isShowingToast) {
    return;
  }

  isShowingToast = true;
  const { message, type } = toastQueue.shift();

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  
  toast.style.cssText = `
    position: fixed;
    top: ${20 + (toastQueue.length * 60)}px;
    right: 20px;
    padding: 12px 24px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: ${10000 + toastQueue.length};
    font-size: 14px;
    font-weight: 500;
    animation: slideInRight 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
  `;
  
  toast.textContent = message;
  document.body.appendChild(toast);

  // 애니메이션 스타일 추가 (한 번만)
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      toast.remove();
      isShowingToast = false;
      showNextToast(); // 다음 토스트 표시
    }, 300);
  }, 3000);
};

export const showToast = (message, type = 'info') => {
  toastQueue.push({ message, type });
  showNextToast();
};
```

---

## 🏗️ 3. 구조 개선

### 문제 3-1: OrderSidebar 컴포넌트가 여전히 비대함

**발견된 문제:**
- `OrderSidebar.jsx`가 183줄로 여전히 큼
- 폼 입력, 추천 메뉴, 장바구니, 주문 버튼이 모두 한 컴포넌트에 있음
- 재사용성 낮음

**개선 제안:**
- 폼 입력 부분을 `OrderForm` 컴포넌트로 분리
- 추천 메뉴를 `RecommendationSection` 컴포넌트로 분리
- 장바구니를 `CartList` 컴포넌트로 분리

**수정된 코드:**

```javascript
// ui/src/components/OrderForm.jsx (새 파일)
import React from 'react';
import { teams } from '../data/menuData';

function OrderForm({ 
  selectedTeam, 
  onTeamChange, 
  name, 
  onNameChange, 
  employeeId, 
  onEmployeeIdChange 
}) {
  const sortedTeams = React.useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, []);

  return (
    <>
      <div className="form-group">
        <label htmlFor="team-select">팀 선택</label>
        <select
          id="team-select"
          className="form-input"
          value={selectedTeam || ''}
          onChange={(e) => onTeamChange(e.target.value)}
        >
          <option value="">팀을 선택하세요</option>
          {sortedTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="name-input">이름</label>
        <input
          id="name-input"
          type="text"
          className="form-input"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="employee-id-input">사원번호</label>
        <input
          id="employee-id-input"
          type="text"
          className="form-input"
          placeholder="사원번호를 입력하세요"
          value={employeeId}
          onChange={(e) => onEmployeeIdChange(e.target.value)}
        />
      </div>
    </>
  );
}

export default OrderForm;

// ui/src/components/RecommendationSection.jsx (새 파일)
import React from 'react';
import { useRecommendations } from '../hooks/useRecommendations';

function RecommendationSection({ selectedTeam, name, employeeId, onRecommendationClick }) {
  const { recommendations, loading } = useRecommendations(selectedTeam, name, employeeId);

  if (!selectedTeam || !name || !employeeId) {
    return null;
  }

  return (
    <div className="form-group">
      <label>추천 메뉴</label>
      {loading ? (
        <div className="recommendations-loading">추천 메뉴를 불러오는 중...</div>
      ) : recommendations.length > 0 ? (
        <div className="recommendations-list">
          {recommendations[0] && (
            <div key={recommendations[0].id} className="recommendation-item">
              <div className="recommendation-info">
                <div className="recommendation-name">{recommendations[0].name}</div>
                <div className="recommendation-category">{recommendations[0].category}</div>
                <div className="recommendation-price">{recommendations[0].base_price.toLocaleString()}원</div>
              </div>
              <button
                className="recommendation-add-btn"
                onClick={() => onRecommendationClick && onRecommendationClick(recommendations[0])}
              >
                추가하기
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="recommendations-empty">주문 이력이 없습니다.</div>
      )}
    </div>
  );
}

export default RecommendationSection;

// ui/src/components/CartList.jsx (새 파일)
import React from 'react';
import { formatOptions } from '../utils/optionUtils';
import { generateCartItemKey } from '../utils/cartUtils';

function CartList({ selectedMenus, onRemoveMenu, onQuantityChange }) {
  if (selectedMenus.length === 0) {
    return <div className="empty-menu-message">메뉴를 선택해주세요</div>;
  }

  return (
    <div className="menu-list">
      {selectedMenus.map((item, index) => {
        if (!item.menu) return null;
        
        const itemKey = generateCartItemKey(item.menu.id, item.options);
        const optionsText = formatOptions(item.options, item.menu);
        
        return (
          <div key={itemKey} className="menu-item">
            <div className="menu-item-info">
              <div className="menu-item-name">{item.menu.name}</div>
              <div className="menu-item-options">{optionsText}</div>
              <div className="menu-item-price">
                {(item.totalPrice || 0).toLocaleString()}원
              </div>
            </div>
            <div className="menu-item-controls">
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => onQuantityChange(index, -1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => onQuantityChange(index, 1)}
                >
                  +
                </button>
              </div>
              <button
                className="remove-btn"
                onClick={() => onRemoveMenu(index)}
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CartList;

// OrderSidebar.jsx (간소화)
import React, { useMemo } from 'react';
import OrderForm from './OrderForm';
import RecommendationSection from './RecommendationSection';
import CartList from './CartList';
import './OrderSidebar.css';

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
  isSubmitting = false,
  onSubmit,
  onRecommendationClick
}) {
  const isFormValid = useMemo(() => {
    return selectedTeam && name && employeeId && selectedMenus.length > 0 && !isSubmitting;
  }, [selectedTeam, name, employeeId, selectedMenus.length, isSubmitting]);

  return (
    <div className="order-sidebar">
      <div className="sidebar-header">
        <span className="cart-icon">🛒</span>
        <h2 className="sidebar-title">주문 정보</h2>
      </div>

      <div className="sidebar-content">
        <OrderForm
          selectedTeam={selectedTeam}
          onTeamChange={onTeamChange}
          name={name}
          onNameChange={onNameChange}
          employeeId={employeeId}
          onEmployeeIdChange={onEmployeeIdChange}
        />

        <RecommendationSection
          selectedTeam={selectedTeam}
          name={name}
          employeeId={employeeId}
          onRecommendationClick={onRecommendationClick}
        />

        <div className="form-group">
          <label>선택한 메뉴</label>
          <div className="selected-menus">
            <CartList
              selectedMenus={selectedMenus}
              onRemoveMenu={onRemoveMenu}
              onQuantityChange={onQuantityChange}
            />
          </div>
        </div>

        {selectedMenus.length > 0 && (
          <div className="total-price">
            <span className="total-label">총 주문 금액</span>
            <span className="total-amount">{totalPrice.toLocaleString()}원</span>
          </div>
        )}

        <button
          className="submit-button"
          disabled={!isFormValid}
          onClick={onSubmit}
        >
          {isSubmitting ? '주문 처리 중...' : '주문하기'}
        </button>
      </div>
    </div>
  );
}

export default OrderSidebar;
```

---

### 문제 3-2: 에러 바운더리 부재

**발견된 문제:**
- React Error Boundary가 없음
- 컴포넌트 에러 시 전체 앱이 크래시됨

**개선 제안:**
- Error Boundary 컴포넌트 생성
- 주요 페이지에 적용

**수정된 코드:**

```javascript
// ui/src/components/ErrorBoundary.jsx (새 파일)
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>오류가 발생했습니다</h2>
          <p>앱을 새로고침해주세요.</p>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// ui/src/App.jsx에 적용
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* 기존 코드 */}
    </ErrorBoundary>
  );
}
```

---

## 📊 종합 개선 우선순위

### 🔴 높은 우선순위 (즉시 수정 권장)
1. **useOrder 훅의 클로저 문제** - 상태 동기화 버그 가능성
2. **OptionModal 가격 계산 최적화** - 성능 개선
3. **StatusPage useEffect 의존성** - React 경고 해결

### 🟡 중간 우선순위 (점진적 개선)
4. **OrderSidebar 컴포넌트 분리** - 가독성 및 재사용성 향상
5. **MemberOrderCard window.confirm 개선** - UX 향상
6. **토스트 큐 시스템** - 여러 메시지 처리 개선

### 🟢 낮은 우선순위 (리팩토링)
7. **Error Boundary 추가** - 안정성 향상
8. **API 에러 처리 개선** - 사용자 경험 향상

---

## ✅ 권장 사항

1. **테스트 코드 작성**: 주요 비즈니스 로직에 대한 단위 테스트 추가
2. **타입 안정성**: TypeScript 도입 고려
3. **성능 모니터링**: React DevTools Profiler로 성능 측정
4. **접근성**: ARIA 라벨 및 키보드 네비게이션 개선
5. **라이브러리 도입**: react-toastify, react-hook-form 등 검토
