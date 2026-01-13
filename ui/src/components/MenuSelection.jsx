import React, { useState, useEffect, useMemo } from 'react';
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
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('메뉴 로딩 실패:', err);
      
      // Network Error 처리
      let errorMessage = '메뉴를 불러오는데 실패했습니다.';
      
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
      } else if (err.response) {
        // 서버에서 응답이 온 경우
        errorMessage = err.response.data?.error || err.response.data?.message || `서버 오류: ${err.response.status}`;
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
      } else {
        // 요청 설정 중 오류 발생
        errorMessage = err.message || '메뉴를 불러오는데 실패했습니다.';
      }
      
      setError(errorMessage);
      console.error('상세 에러:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        request: err.request
      });
    } finally {
      setLoading(false);
    }
  };

  // 필터링 결과를 메모이제이션하여 성능 최적화
  const filteredMenus = useMemo(() => {
    if (selectedCategory === '전체') {
      return menus;
    }
    return menus.filter(menu => menu.category === selectedCategory);
  }, [menus, selectedCategory]);

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
