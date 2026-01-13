import React, { useState, useEffect } from 'react';
import { menuAPI } from '../utils/api';
import './MenuSelection.css';

function MenuSelection({ onMenuSelect }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const categories = ['전체', '커피', '논커피', '디저트'];

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      // 판매 중인 메뉴만 조회
      const data = await menuAPI.getMenus({ status: 'active' });
      setMenus(data);
    } catch (err) {
      console.error('메뉴 로딩 실패:', err);
      const errorMessage = err.response?.data?.error || err.message || '메뉴를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('상세 에러:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMenus = selectedCategory === '전체'
    ? menus
    : menus.filter(menu => menu.category === selectedCategory);

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

      {loading ? (
        <div className="loading-message">메뉴를 불러오는 중...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredMenus.length === 0 ? (
        <div className="empty-message">표시할 메뉴가 없습니다.</div>
      ) : (
        <div className="menu-grid">
          {filteredMenus.map(menu => (
            <div key={menu.id} className="menu-card">
              <div className="menu-card-content">
                <div className="menu-name">{menu.name}</div>
                <div className="menu-category-tag">{menu.category}</div>
                <div className="menu-price">{menu.base_price.toLocaleString()}원~</div>
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
      )}
    </div>
  );
}

export default MenuSelection;
