import React, { useMemo } from 'react';
import { teams } from '../data/menuData';
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
  onSubmit
}) {
  const isFormValid = selectedTeam && name && employeeId && selectedMenus.length > 0;

  // 팀 목록을 한글 순서로 정렬
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      return a.name.localeCompare(b.name, 'ko');
    });
  }, []);

  return (
    <div className="order-sidebar">
      <div className="sidebar-header">
        <span className="cart-icon">🛒</span>
        <h2 className="sidebar-title">주문 정보</h2>
      </div>

      <div className="sidebar-content">
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

        <div className="form-group">
          <label>선택한 메뉴</label>
          <div className="selected-menus">
            {selectedMenus.length === 0 ? (
              <div className="empty-menu-message">메뉴를 선택해주세요</div>
            ) : (
              <div className="menu-list">
                {selectedMenus.map((item, index) => (
                  <div key={`${item.menu.id}-${index}-${JSON.stringify(item.options)}`} className="menu-item">
                    <div className="menu-item-info">
                      <div className="menu-item-name">{item.menu.name}</div>
                      <div className="menu-item-options">
                        {[
                          // 아이스, 스무디, 설향, 스파클링 메뉴가 아닌 경우에만 temperature 표시
                          item.menu.name && (item.menu.name.includes('아이스') || item.menu.name.includes('스무디') || item.menu.name.includes('설향') || item.menu.name.includes('스파클링')) 
                            ? null 
                            : item.options.temperature,
                          item.options.size,
                          item.options.shot,
                          item.options.extra
                        ].filter(Boolean).join(', ') || '기본 옵션'}
                      </div>
                      <div className="menu-item-price">
                        {item.totalPrice.toLocaleString()}원
                      </div>
                    </div>
                    <div className="menu-item-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => onQuantityChange(index, -1)}
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
                ))}
              </div>
            )}
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
          주문하기
        </button>
      </div>
    </div>
  );
}

export default OrderSidebar;
