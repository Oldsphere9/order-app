import React, { useState, useEffect } from 'react';
import { getOrders } from '../utils/orderStorage';
import StatsCards from '../components/StatsCards';
import TeamOrderCard from '../components/TeamOrderCard';
import './StatusPage.css';

function StatusPage() {
  const [orders, setOrders] = useState([]);
  const [teamOrders, setTeamOrders] = useState([]);
  const [stats, setStats] = useState({
    totalQuantity: 0,
    teamCount: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadOrders();
    // 주문 데이터 변경 감지를 위한 이벤트 리스너
    const handleStorageChange = () => {
      loadOrders();
    };
    window.addEventListener('storage', handleStorageChange);
    // 주문 페이지에서 주문이 완료되면 상태 업데이트를 위한 커스텀 이벤트
    window.addEventListener('orderUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderUpdated', handleStorageChange);
    };
  }, []);

  const loadOrders = () => {
    const allOrders = getOrders();
    setOrders(allOrders);
    processOrders(allOrders);
  };

  const processOrders = (allOrders) => {
    // 팀별로 주문 그룹화
    const teamMap = new Map();

    allOrders.forEach(order => {
      const teamName = order.teamName;
      
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          teamName,
          items: []
        });
      }

      // 각 메뉴 항목을 옵션별로 그룹화
      order.menus.forEach(menuItem => {
        const optionsKey = [
          menuItem.options.temperature,
          menuItem.options.size,
          menuItem.options.shot,
          menuItem.options.extra
        ].filter(Boolean).join(', ');

        const existingItem = teamMap.get(teamName).items.find(
          item => item.menuName === menuItem.menu.name && item.options === optionsKey
        );

        if (existingItem) {
          // 동일한 메뉴와 옵션이 있으면 수량과 금액 합산
          existingItem.quantity += menuItem.quantity;
          existingItem.amount += menuItem.totalPrice;
        } else {
          // 새로운 항목 추가
          teamMap.get(teamName).items.push({
            menuName: menuItem.menu.name,
            options: optionsKey || '기본',
            quantity: menuItem.quantity,
            unitPrice: menuItem.unitPrice,
            amount: menuItem.totalPrice
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

    // 통계 계산
    const totalQuantity = teamOrdersArray.reduce((sum, team) => sum + team.totalQuantity, 0);
    const teamCount = teamOrdersArray.length;
    const totalAmount = teamOrdersArray.reduce((sum, team) => sum + team.totalAmount, 0);

    setStats({
      totalQuantity,
      teamCount,
      totalAmount
    });
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
          
          {teamOrders.length === 0 ? (
            <div className="empty-state">
              <p>주문 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="team-cards">
              {teamOrders.map((team, index) => (
                <TeamOrderCard
                  key={index}
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
