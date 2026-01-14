import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { menuAPI } from '../utils/api';
import { showToast } from '../utils/toast';
import './MenuManagementPage.css';

function MenuManagementPage() {
  const [activeMenus, setActiveMenus] = useState([]);
  const [seasonOffMenus, setSeasonOffMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [activeTab, setActiveTab] = useState('season_off'); // 'active' or 'season_off'

  const loadMenus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'season_off') {
        const data = await menuAPI.getMenus({ status: 'season_off' });
        setSeasonOffMenus(data);
      } else {
        const data = await menuAPI.getMenus({ status: 'active' });
        setActiveMenus(data);
      }
    } catch (err) {
      console.error('메뉴 로딩 실패:', err);
      setError('메뉴를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  const handleStatusChange = useCallback(async (menuId, newStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [menuId]: true }));
      await menuAPI.updateMenu(menuId, { sale_status: newStatus });
      
      // 목록 새로고침
      await loadMenus();
      
      const statusText = newStatus === 'active' ? '활성화' : 'Season Off';
      showToast(`메뉴가 ${statusText} 상태로 변경되었습니다.`, 'success');
    } catch (err) {
      console.error('메뉴 상태 변경 실패:', err);
      const errorMessage = err.response?.data?.error || err.message || '메뉴 상태 변경에 실패했습니다.';
      showToast(errorMessage, 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [menuId]: false }));
    }
  }, [loadMenus]);

  const currentMenus = activeTab === 'season_off' ? seasonOffMenus : activeMenus;

  // 카테고리 순서 정의 (한글 순서: 커피, 논커피, 디저트)
  const categoryOrder = ['커피', '논커피', '디저트'];

  // 메뉴를 카테고리별로 그룹화하고 정렬
  const groupedMenus = useMemo(() => {
    const grouped = {};
    
    currentMenus.forEach(menu => {
      const category = menu.category || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(menu);
    });

    // 각 카테고리 내에서 메뉴 이름으로 한글 순서 정렬
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        return a.name.localeCompare(b.name, 'ko');
      });
    });

    // 카테고리 순서대로 정렬된 배열 생성
    const sortedCategories = categoryOrder.filter(cat => grouped[cat]);
    
    return sortedCategories.map(category => ({
      category,
      menus: grouped[category]
    }));
  }, [currentMenus]);

  return (
    <div className="menu-management-page">
      <div className="management-content">
        <div className="management-header">
          <h2 className="management-title">
            <span className="management-icon">⚙️</span>
            메뉴 관리
          </h2>
          <p className="management-subtitle">메뉴의 판매 상태를 관리할 수 있습니다.</p>
        </div>

        <div className="status-tabs">
          <button
            className={`status-tab ${activeTab === 'season_off' ? 'active' : ''}`}
            onClick={() => setActiveTab('season_off')}
          >
            Season Off 메뉴
          </button>
          <button
            className={`status-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            판매중 메뉴
          </button>
        </div>

        {loading ? (
          <div className="loading-state">메뉴를 불러오는 중...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : currentMenus.length === 0 ? (
          <div className="empty-state">
            <p>현재 {activeTab === 'season_off' ? 'Season off' : '판매중'} 상태인 메뉴가 없습니다.</p>
          </div>
        ) : (
          <div className="menu-list-grouped">
            {groupedMenus.map(({ category, menus }) => (
              <div key={category} className="category-section">
                <h3 className="category-title">{category}</h3>
                <div className="menu-list">
                  {menus.map(menu => (
                    <div key={menu.id} className="menu-management-card">
                      <div className="menu-info">
                        <div className="menu-name-section">
                          <h3 className="menu-name">{menu.name}</h3>
                          <span className="menu-category-badge">{category}</span>
                        </div>
                        <div className="menu-details">
                          {menu.description && (
                            <p className="menu-description">{menu.description}</p>
                          )}
                          <p className="menu-price">기본 가격: {menu.base_price.toLocaleString()}원</p>
                          <p className="menu-status">
                            현재 상태: <span className={`status-badge ${menu.sale_status === 'season_off' ? 'season-off' : 'active'}`}>
                              {menu.sale_status === 'season_off' ? 'Season Off' : '활성'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="menu-actions">
                        {menu.sale_status === 'season_off' ? (
                          <button
                            className="activate-button"
                            onClick={() => handleStatusChange(menu.id, 'active')}
                            disabled={updating[menu.id]}
                          >
                            {updating[menu.id] ? '처리 중...' : '활성화하기'}
                          </button>
                        ) : (
                          <button
                            className="season-off-button"
                            onClick={() => handleStatusChange(menu.id, 'season_off')}
                            disabled={updating[menu.id]}
                          >
                            {updating[menu.id] ? '처리 중...' : 'Season Off로 변경'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuManagementPage;
