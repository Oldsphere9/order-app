import React from 'react';
import './StatsCards.css';

function StatsCards({ totalQuantity, teamCount, totalAmount }) {
  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-icon">☰</div>
        <div className="stat-content">
          <div className="stat-title">전체 주문 수량</div>
          <div className="stat-value">{totalQuantity} 개</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-content">
          <div className="stat-title">참여 팀 수</div>
          <div className="stat-value">{teamCount} 팀</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">₩</div>
        <div className="stat-content">
          <div className="stat-title">총 주문 금액</div>
          <div className="stat-value">{totalAmount.toLocaleString()} 원</div>
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
