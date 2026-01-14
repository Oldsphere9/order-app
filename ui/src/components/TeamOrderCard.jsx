import React, { memo } from 'react';
import './TeamOrderCard.css';

const TeamOrderCard = memo(({ teamName, orderItems, totalQuantity, totalAmount }) => {
  return (
    <div className="team-order-card">
      <div className="team-header">
        <div className="team-header-left">
          <span className="team-icon">👥</span>
          <span className="team-name">{teamName}</span>
        </div>
        <div className="team-header-right">
          <span className="team-summary">총 {totalQuantity}개</span>
          <span className="team-amount">{totalAmount.toLocaleString()}원</span>
        </div>
      </div>
      
      <div className="order-table-container">
        <table className="order-table">
          <thead>
            <tr>
              <th>메뉴명</th>
              <th>옵션</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, index) => (
              <tr key={index}>
                <td>{item.menuName}</td>
                <td>{item.options}</td>
                <td>{item.quantity}개</td>
                <td>{item.unitPrice.toLocaleString()}원</td>
                <td>{item.amount.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  if (prevProps.teamName !== nextProps.teamName) return false;
  if (prevProps.totalQuantity !== nextProps.totalQuantity) return false;
  if (prevProps.totalAmount !== nextProps.totalAmount) return false;
  if (prevProps.orderItems.length !== nextProps.orderItems.length) return false;
  
  // orderItems 배열 비교 (간단한 JSON 비교)
  const prevItemsStr = JSON.stringify(prevProps.orderItems);
  const nextItemsStr = JSON.stringify(nextProps.orderItems);
  if (prevItemsStr !== nextItemsStr) return false;
  
  return true;
});

TeamOrderCard.displayName = 'TeamOrderCard';

export default TeamOrderCard;
