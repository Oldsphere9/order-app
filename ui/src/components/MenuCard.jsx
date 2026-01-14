import React, { memo, useCallback } from 'react';
import './MenuCard.css';

const MenuCard = memo(({ menu, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(menu);
  }, [menu, onSelect]);

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
