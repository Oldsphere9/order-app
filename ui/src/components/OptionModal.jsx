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
          {/* 디저트 메뉴가 아닌 경우에만 옵션 표시 */}
          {!isDessert && (
            <>
              {/* 아이스, 스무디, 설향, 스파클링 메뉴가 아닌 경우에만 온도 옵션 표시 */}
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

          {/* 디저트 메뉴인 경우 옵션 없음 메시지 */}
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
