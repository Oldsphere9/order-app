import React, { memo, useMemo, useCallback } from 'react';
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

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  const handleDecrease = useCallback(() => {
    if (item.quantity > 1) {
      onQuantityChange(index, -1);
    }
  }, [index, item.quantity, onQuantityChange]);

  const handleIncrease = useCallback(() => {
    onQuantityChange(index, 1);
  }, [index, onQuantityChange]);

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
  if (prevProps.index !== nextProps.index) return false;
  if (prevProps.item.menu?.id !== nextProps.item.menu?.id) return false;
  if (prevProps.item.quantity !== nextProps.item.quantity) return false;
  if (prevProps.item.totalPrice !== nextProps.item.totalPrice) return false;
  if (prevProps.onRemove !== nextProps.onRemove) return false;
  if (prevProps.onQuantityChange !== nextProps.onQuantityChange) return false;
  
  // options 비교 (간단한 문자열 비교로 대체 가능)
  const prevOptionsStr = JSON.stringify(prevProps.item.options);
  const nextOptionsStr = JSON.stringify(nextProps.item.options);
  if (prevOptionsStr !== nextOptionsStr) return false;
  
  return true;
});

CartItem.displayName = 'CartItem';

export default CartItem;
