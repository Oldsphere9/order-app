import React from 'react';
import { formatOptions } from '../utils/optionUtils';
import { showToast } from '../utils/toast';
import './MemberOrderCard.css';

function MemberOrderCard({ member, orders, onDelete }) {
  if (!member || !orders) return null;

  const handleDelete = () => {
    if (window.confirm(`${member.name}님의 모든 주문을 취소하시겠습니까?`)) {
      onDelete(member.id);
    }
  };

  return (
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
          <button className="cancel-order-button" onClick={handleDelete}>
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
  );
}

export default MemberOrderCard;
