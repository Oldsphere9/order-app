import React, { useState, useEffect } from 'react';
import { orderAPI } from '../utils/api';
import StatsCards from '../components/StatsCards';
import TeamOrderCard from '../components/TeamOrderCard';
import './StatusPage.css';

function StatusPage() {
  const [teamOrders, setTeamOrders] = useState([]);
  const [stats, setStats] = useState({
    totalQuantity: 0,
    teamCount: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    // 주문 페이지에서 주문이 완료되면 상태 업데이트를 위한 커스텀 이벤트
    const handleOrderUpdated = () => {
      loadData();
    };
    window.addEventListener('orderUpdated', handleOrderUpdated);
    
    return () => {
      window.removeEventListener('orderUpdated', handleOrderUpdated);
    };
  }, []);

  // 화면이 포커스를 받을 때 데이터 갱신
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 주문 목록과 통계를 동시에 조회
      const [ordersData, statsData] = await Promise.all([
        orderAPI.getOrders(),
        orderAPI.getOrderStats()
      ]);
      
      // 통계 설정
      setStats({
        totalQuantity: statsData.total_quantity || 0,
        teamCount: statsData.team_count || 0,
        totalAmount: statsData.total_amount || 0
      });
      
      // 주문 데이터 처리 (팀별로 그룹화 및 동일 옵션 메뉴별 집계)
      processOrders(ordersData);
    } catch (err) {
      console.error('데이터 로딩 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const processOrders = (ordersData) => {
    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      setTeamOrders([]);
      return;
    }

    // 팀별로 주문 그룹화 및 동일 옵션 메뉴별 집계
    const teamMap = new Map();

    ordersData.forEach(orderGroup => {
      const teamName = orderGroup.member.team;
      
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          teamName,
          items: []
        });
      }

      // 각 주문 항목을 옵션별로 그룹화
      orderGroup.orders.forEach(order => {
        const optionsKey = [
          order.options?.temperature,
          order.options?.size,
          order.options?.shot,
          order.options?.extra
        ].filter(Boolean).join(', ');

        const normalizedOptionsKey = optionsKey || '기본 옵션';
        
        const existingItem = teamMap.get(teamName).items.find(
          item => item.menuName === order.menu.name && item.options === normalizedOptionsKey
        );

        if (existingItem) {
          // 동일한 메뉴와 옵션이 있으면 수량과 금액 합산
          existingItem.quantity += order.quantity;
          existingItem.amount += order.total_price;
        } else {
          // 새로운 항목 추가
          teamMap.get(teamName).items.push({
            menuName: order.menu.name,
            options: normalizedOptionsKey,
            quantity: order.quantity,
            unitPrice: order.unit_price,
            amount: order.total_price
          });
        }
      });
    });

    // 팀별 주문 데이터를 배열로 변환
    const teamOrdersArray = Array.from(teamMap.values()).map(team => ({
      teamName: team.teamName,
      items: team.items,
      totalQuantity: team.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: team.items.reduce((sum, item) => sum + item.amount, 0)
    }));

    setTeamOrders(teamOrdersArray);
  };

  return (
    <div className="status-page">
      <div className="status-content">
        <StatsCards
          totalQuantity={stats.totalQuantity}
          teamCount={stats.teamCount}
          totalAmount={stats.totalAmount}
        />

        <div className="team-orders-section">
          <h2 className="section-title">팀별 주문 현황</h2>
          
          {loading ? (
            <div className="empty-state">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p style={{ color: '#d32f2f' }}>{error}</p>
            </div>
          ) : teamOrders.length === 0 ? (
            <div className="empty-state">
              <p>주문 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="team-cards">
              {teamOrders.map((team) => (
                <TeamOrderCard
                  key={team.teamName}
                  teamName={team.teamName}
                  orderItems={team.items}
                  totalQuantity={team.totalQuantity}
                  totalAmount={team.totalAmount}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusPage;
