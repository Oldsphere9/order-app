import React, { useState } from 'react';
import { menuData } from '../data/menuData';
import './MenuSelection.css';

function MenuSelection({ onMenuSelect }) {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const categories = ['전체', '커피', '논커피', '디저트'];

  const filteredMenus = selectedCategory === '전체'
    ? menuData
    : menuData.filter(menu => menu.category === selectedCategory);

  return (
    <div className="menu-selection">
      <div className="menu-header">
        <h2 className="menu-title">
          <span className="menu-icon">☕</span>
          메뉴 선택
        </h2>
        <p className="menu-subtitle">원하는 메뉴를 선택해주세요</p>
      </div>

      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filteredMenus.map(menu => (
          <div key={menu.id} className="menu-card">
            <div className="menu-card-content">
              <div className="menu-name">{menu.name}</div>
              <div className="menu-category-tag">{menu.category}</div>
              <div className="menu-price">{menu.basePrice.toLocaleString()}원~</div>
            </div>
            <button
              className="option-button"
              onClick={() => onMenuSelect(menu)}
            >
              + 옵션 선택
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuSelection;
