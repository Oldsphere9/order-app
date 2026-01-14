import React, { memo, useCallback, useMemo } from 'react';
import { formatOptions } from '../utils/optionUtils';
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
  // 커스텀 비교 함수
  if (prevProps.member?.id !== nextProps.member?.id) return false;
  if (prevProps.member?.name !== nextProps.member?.name) return false;
  if (prevProps.orders?.length !== nextProps.orders?.length) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  
  // orders 배열 비교 (간단한 JSON 비교)
  const prevOrdersStr = JSON.stringify(prevProps.orders);
  const nextOrdersStr = JSON.stringify(nextProps.orders);
  if (prevOrdersStr !== nextOrdersStr) return false;
  
  return true;
});

MemberOrderCard.displayName = 'MemberOrderCard';

export default MemberOrderCard;
