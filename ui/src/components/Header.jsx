import React from 'react';
import './Header.css';

function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="coffee-icon">☕</span>
          <span className="logo-text">커피빈 주문 시스템</span>
        </div>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'order' ? 'active' : ''}`}
            onClick={() => onTabChange('order')}
          >
            주문하기
          </button>
          <button
            className={`nav-tab ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => onTabChange('status')}
          >
            주문 현황
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
