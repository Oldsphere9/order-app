import React, { useState, useEffect } from 'react';
import './OptionModal.css';

function OptionModal({ menu, isOpen, onClose, onConfirm }) {
  const [options, setOptions] = useState({
    temperature: 'HOT',
    size: 'Regular',
    shot: '기본',
    extra: ''
  });

  // 메뉴가 변경될 때 옵션 초기화
  useEffect(() => {
    if (menu) {
      setOptions({
        temperature: 'HOT',
        size: 'Regular',
        shot: '기본',
        extra: ''
      });
    }
  }, [menu]);

  if (!isOpen) return null;

  const calculatePrice = () => {
    let price = menu.basePrice;
    
    // 사이즈에 따른 가격 조정
    if (options.size === 'Grande') price += 500;
    else if (options.size === 'Venti') price += 1000;
    
    // 샷 추가에 따른 가격 조정
    if (options.shot === '+1샷') price += 500;
    else if (options.shot === '+2샷') price += 1000;
    
    // 추가 옵션
    if (options.extra === '휘핑크림 추가') price += 500;
    else if (options.extra === '시럽 추가') price += 500;
    
    return price;
  };

  const handleConfirm = () => {
    onConfirm({
      menu,
      options,
      quantity: 1,
      unitPrice: calculatePrice(),
      totalPrice: calculatePrice()
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{menu.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="option-group">
            <label>온도</label>
            <div className="option-buttons">
              <button
                className={`option-btn ${options.temperature === 'HOT' ? 'active' : ''}`}
                onClick={() => setOptions({...options, temperature: 'HOT'})}
              >
                HOT
              </button>
              <button
                className={`option-btn ${options.temperature === 'ICE' ? 'active' : ''}`}
                onClick={() => setOptions({...options, temperature: 'ICE'})}
              >
                ICE
              </button>
            </div>
          </div>

          <div className="option-group">
            <label>사이즈</label>
            <div className="option-buttons">
              <button
                className={`option-btn ${options.size === 'Regular' ? 'active' : ''}`}
                onClick={() => setOptions({...options, size: 'Regular'})}
              >
                Regular
              </button>
              <button
                className={`option-btn ${options.size === 'Grande' ? 'active' : ''}`}
                onClick={() => setOptions({...options, size: 'Grande'})}
              >
                Grande (+500원)
              </button>
              <button
                className={`option-btn ${options.size === 'Venti' ? 'active' : ''}`}
                onClick={() => setOptions({...options, size: 'Venti'})}
              >
                Venti (+1,000원)
              </button>
            </div>
          </div>

          {menu.category === '커피' && (
            <div className="option-group">
              <label>샷 추가</label>
              <div className="option-buttons">
                <button
                  className={`option-btn ${options.shot === '기본' ? 'active' : ''}`}
                  onClick={() => setOptions({...options, shot: '기본'})}
                >
                  기본
                </button>
                <button
                  className={`option-btn ${options.shot === '+1샷' ? 'active' : ''}`}
                  onClick={() => setOptions({...options, shot: '+1샷'})}
                >
                  +1샷 (+500원)
                </button>
                <button
                  className={`option-btn ${options.shot === '+2샷' ? 'active' : ''}`}
                  onClick={() => setOptions({...options, shot: '+2샷'})}
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
                onClick={() => setOptions({...options, extra: ''})}
              >
                없음
              </button>
              <button
                className={`option-btn ${options.extra === '휘핑크림 추가' ? 'active' : ''}`}
                onClick={() => setOptions({...options, extra: '휘핑크림 추가'})}
              >
                휘핑크림 추가 (+500원)
              </button>
              <button
                className={`option-btn ${options.extra === '시럽 추가' ? 'active' : ''}`}
                onClick={() => setOptions({...options, extra: '시럽 추가'})}
              >
                시럽 추가 (+500원)
              </button>
            </div>
          </div>

          <div className="price-preview">
            <span>예상 가격: </span>
            <span className="price-amount">{calculatePrice().toLocaleString()}원</span>
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
