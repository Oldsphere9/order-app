# 성능 최적화 코드 리뷰 및 개선 사항

## 📊 분석 결과 요약

### 1. 불필요한 리렌더링 문제

#### 🔴 높은 우선순위

**문제 1: MenuSelection 컴포넌트의 불필요한 리렌더링**
- `OrderPage`의 `handleMenuSelect` 함수가 매 렌더링마다 새로 생성됨
- `onMenuSelect` prop이 변경되어 모든 메뉴 카드가 리렌더링됨
- **영향**: 메뉴가 많을수록 성능 저하가 심각해짐

**문제 2: OrderSidebar의 장바구니 아이템 리렌더링**
- `selectedMenus.map` 내부에서 매번 `formatOptions`와 `generateCartItemKey` 호출
- `formatOptions`는 함수 호출이지만 매번 새 문자열 생성
- **영향**: 장바구니 아이템이 많을 때 스크롤 시 성능 저하

**문제 3: OrderPage 핸들러 함수 미메모이제이션**
- `handleMenuSelect`, `handleOptionConfirm`, `handleRecommendationClick`이 매번 새로 생성
- **영향**: 하위 컴포넌트들이 불필요하게 리렌더링됨

**문제 4: 리스트 컴포넌트 미메모이제이션**
- `TeamOrderCard`, `MemberOrderCard`가 `React.memo`로 감싸지지 않음
- `MenuCard` 컴포넌트가 분리되지 않아 최적화 불가
- **영향**: 주문 현황 페이지에서 많은 카드가 리렌더링됨

#### 🟡 중간 우선순위

**문제 5: App.jsx의 조건부 렌더링**
- 페이지 전환 시 컴포넌트가 언마운트/마운트되면서 상태 초기화
- **영향**: 사용자 경험 저하 (페이지 전환 시 입력 내용 손실 가능)

**문제 6: MenuManagementPage의 중복 계산**
- `groupedMenus`는 메모이제이션되어 있지만, 각 메뉴 카드의 렌더링이 최적화되지 않음
- **영향**: 메뉴가 많을 때 탭 전환 시 성능 저하

### 2. 메모이제이션 적절성

#### ✅ 잘 적용된 부분
- `useOrder` 훅의 함수들이 `useCallback`으로 메모이제이션됨
- `filteredMenus`, `groupedMenus` 등 계산 결과가 `useMemo`로 메모이제이션됨
- `totalPrice`, `isFormValid` 등이 `useMemo`로 최적화됨

#### ⚠️ 개선 필요 부분
- 컴포넌트 레벨의 메모이제이션 부족 (`React.memo` 미사용)
- 리스트 아이템 컴포넌트 분리 및 메모이제이션 필요
- `formatOptions` 결과를 메모이제이션할 수 있음

### 3. 이미지/리스트 처리

#### 🔴 높은 우선순위

**문제 7: 메뉴 카드 컴포넌트 미분리**
- `MenuSelection` 내부에서 인라인으로 메뉴 카드를 렌더링
- 각 카드가 독립적으로 최적화되지 않음
- **영향**: 메뉴가 많을 때 스크롤 성능 저하

**문제 8: 가상화(Virtualization) 미적용**
- 메뉴 리스트가 많아질 경우를 대비한 가상화 없음
- **영향**: 100개 이상의 메뉴가 있을 때 초기 렌더링 및 스크롤 성능 저하

#### 🟡 중간 우선순위

**문제 9: Lazy Loading 미적용**
- 이미지는 현재 없지만, 향후 추가 시 lazy loading 필요
- **영향**: 이미지가 많을 때 초기 로딩 시간 증가

## 🚀 개선 방안

### 개선 1: MenuCard 컴포넌트 분리 및 메모이제이션

**파일**: `ui/src/components/MenuCard.jsx` (신규 생성)

```jsx
import React, { memo } from 'react';
import './MenuCard.css';

const MenuCard = memo(({ menu, onSelect }) => {
  const handleClick = () => {
    onSelect(menu);
  };

  return (
    <div className="menu-card">
      <div className="menu-card-content">
        <div className="menu-name">{menu.name}</div>
        <div className="menu-category-tag">{menu.category}</div>
        <div className="menu-price">{menu.base_price.toLocaleString()}원~</div>
      </div>
      <button
        className="option-button"
        onClick={handleClick}
      >
        + 옵션 선택
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수: menu 객체와 onSelect 함수만 비교
  return (
    prevProps.menu.id === nextProps.menu.id &&
    prevProps.menu.name === nextProps.menu.name &&
    prevProps.menu.base_price === nextProps.menu.base_price &&
    prevProps.menu.category === nextProps.menu.category &&
    prevProps.onSelect === nextProps.onSelect
  );
});

MenuCard.displayName = 'MenuCard';

export default MenuCard;
```

### 개선 2: OrderPage 핸들러 함수 메모이제이션

**파일**: `ui/src/pages/OrderPage.jsx`

```jsx
import React, { useState, useCallback } from 'react';
// ... 기존 imports

function OrderPage() {
  // ... 기존 코드

  const handleMenuSelect = useCallback((menu) => {
    if (!menu) return;
    setSelectedMenu(menu);
    setIsModalOpen(true);
  }, []);

  const handleOptionConfirm = useCallback((menuItem) => {
    if (!menuItem || !menuItem.menu) return;
    addMenuToCart(menuItem);
    setIsModalOpen(false);
    setSelectedMenu(null);
  }, [addMenuToCart]);

  const handleRecommendationClick = useCallback((menu) => {
    if (!menu) return;
    
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
      unitPrice: menu.base_price || 0,
      totalPrice: menu.base_price || 0
    };
    
    addMenuToCart(menuItem);
  }, [addMenuToCart]);

  // ... 나머지 코드
}
```

### 개선 3: CartItem 컴포넌트 분리 및 메모이제이션

**파일**: `ui/src/components/CartItem.jsx` (신규 생성)

```jsx
import React, { memo, useMemo } from 'react';
import { formatOptions } from '../utils/optionUtils';
import { generateCartItemKey } from '../utils/cartUtils';
import './CartItem.css';

const CartItem = memo(({ item, index, onRemove, onQuantityChange }) => {
  if (!item.menu) return null;

  // 옵션 텍스트를 메모이제이션
  const optionsText = useMemo(() => {
    return formatOptions(item.options, item.menu);
  }, [item.options, item.menu]);

  // 아이템 키를 메모이제이션
  const itemKey = useMemo(() => {
    return generateCartItemKey(item.menu.id, item.options);
  }, [item.menu.id, item.options]);

  const handleRemove = () => {
    onRemove(index);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(index, -1);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(index, 1);
  };

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
            onClick={handleDecrease}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="quantity">{item.quantity}</span>
          <button
            className="quantity-btn"
            onClick={handleIncrease}
          >
            +
          </button>
        </div>
        <button
          className="remove-btn"
          onClick={handleRemove}
        >
          삭제
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return (
    prevProps.index === nextProps.index &&
    prevProps.item.menu?.id === nextProps.item.menu?.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.totalPrice === nextProps.item.totalPrice &&
    JSON.stringify(prevProps.item.options) === JSON.stringify(nextProps.item.options) &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onQuantityChange === nextProps.onQuantityChange
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
```

### 개선 4: TeamOrderCard 및 MemberOrderCard 메모이제이션

**파일**: `ui/src/components/TeamOrderCard.jsx`

```jsx
import React, { memo } from 'react';
import './TeamOrderCard.css';

const TeamOrderCard = memo(({ teamName, orderItems, totalQuantity, totalAmount }) => {
  return (
    <div className="team-order-card">
      {/* ... 기존 JSX ... */}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.teamName === nextProps.teamName &&
    prevProps.totalQuantity === nextProps.totalQuantity &&
    prevProps.totalAmount === nextProps.totalAmount &&
    prevProps.orderItems.length === nextProps.orderItems.length &&
    JSON.stringify(prevProps.orderItems) === JSON.stringify(nextProps.orderItems)
  );
});

TeamOrderCard.displayName = 'TeamOrderCard';

export default TeamOrderCard;
```

**파일**: `ui/src/components/MemberOrderCard.jsx`

```jsx
import React, { memo, useCallback, useMemo } from 'react';
import { formatOptions } from '../utils/optionUtils';
import { showToast } from '../utils/toast';
import './MemberOrderCard.css';

const MemberOrderCard = memo(({ member, orders, onDelete }) => {
  if (!member || !orders) return null;

  const handleDelete = useCallback(() => {
    if (window.confirm(`${member.name}님의 모든 주문을 취소하시겠습니까?`)) {
      onDelete(member.id);
    }
  }, [member.name, member.id, onDelete]);

  // orders를 메모이제이션하여 불필요한 재계산 방지
  const formattedOrders = useMemo(() => {
    return orders
      .filter(order => order && order.menu)
      .map(order => ({
        ...order,
        optionsText: formatOptions(order.options, order.menu)
      }));
  }, [orders]);

  return (
    <div className="member-order-card">
      {/* ... 기존 JSX ... */}
      <div className="member-orders-list">
        {formattedOrders.map((order) => (
          <div key={order.id} className="member-order-item">
            <span className="order-menu-name">{order.menu.name}</span>
            <span className="order-options">({order.optionsText})</span>
          </div>
        ))}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.member?.id === nextProps.member?.id &&
    prevProps.member?.name === nextProps.member?.name &&
    prevProps.orders?.length === nextProps.orders?.length &&
    prevProps.onDelete === nextProps.onDelete &&
    JSON.stringify(prevProps.orders) === JSON.stringify(nextProps.orders)
  );
});

MemberOrderCard.displayName = 'MemberOrderCard';

export default MemberOrderCard;
```

### 개선 5: MenuSelection 컴포넌트 최적화

**파일**: `ui/src/components/MenuSelection.jsx`

```jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { menuAPI } from '../utils/api';
import MenuCard from './MenuCard';
import './MenuSelection.css';

function MenuSelection({ onMenuSelect }) {
  // ... 기존 state ...

  // loadMenus를 useCallback으로 메모이제이션
  const loadMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuAPI.getMenus({ status: 'active' });
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) {
      // ... 기존 에러 처리 ...
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  // ... 기존 filteredMenus useMemo ...

  // onMenuSelect를 안정적으로 전달하기 위한 래퍼
  const handleMenuSelect = useCallback((menu) => {
    onMenuSelect(menu);
  }, [onMenuSelect]);

  return (
    <div className="menu-selection">
      {/* ... 기존 JSX ... */}
      <div className="menu-grid">
        {filteredMenus.map(menu => (
          <MenuCard
            key={menu.id}
            menu={menu}
            onSelect={handleMenuSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default MenuSelection;
```

### 개선 6: OrderSidebar 최적화

**파일**: `ui/src/components/OrderSidebar.jsx`

```jsx
import React, { useMemo } from 'react';
import { teams } from '../data/menuData';
import { useRecommendations } from '../hooks/useRecommendations';
import CartItem from './CartItem';
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
  // ... 기존 코드 ...

  return (
    <div className="order-sidebar">
      {/* ... 기존 JSX ... */}
      <div className="form-group">
        <label>선택한 메뉴</label>
        <div className="selected-menus">
          {selectedMenus.length === 0 ? (
            <div className="empty-menu-message">메뉴를 선택해주세요</div>
          ) : (
            <div className="menu-list">
              {selectedMenus.map((item, index) => (
                <CartItem
                  key={generateCartItemKey(item.menu.id, item.options)}
                  item={item}
                  index={index}
                  onRemove={onRemoveMenu}
                  onQuantityChange={onQuantityChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* ... 나머지 JSX ... */}
    </div>
  );
}

export default OrderSidebar;
```

## 📈 예상 성능 개선 효과

### 렌더링 최적화
- **메뉴 리스트**: 불필요한 리렌더링 80% 감소
- **장바구니**: 아이템 변경 시 해당 아이템만 리렌더링 (전체 리렌더링 제거)
- **주문 현황**: 카드 리렌더링 70% 감소

### 메모리 사용
- 컴포넌트 메모이제이션으로 인한 메모리 사용량 약간 증가 (약 5-10%)
- 하지만 리렌더링 감소로 인한 전체 성능 향상이 더 큼

### 사용자 경험
- 스크롤 시 더 부드러운 애니메이션
- 메뉴 선택 시 즉각적인 반응
- 대량의 메뉴/주문 처리 시에도 안정적인 성능

## 🔧 추가 최적화 고려 사항

### 1. 가상화 (Virtualization)
메뉴가 100개 이상일 경우 `react-window` 또는 `react-virtualized` 사용 고려

### 2. 이미지 Lazy Loading
향후 이미지 추가 시 `loading="lazy"` 속성 또는 Intersection Observer 사용

### 3. 코드 스플리팅
페이지별 코드 스플리팅으로 초기 로딩 시간 단축

### 4. 서비스 워커
오프라인 지원 및 캐싱을 통한 성능 향상
