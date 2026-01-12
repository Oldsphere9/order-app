import React, { useState } from 'react';
import MenuSelection from '../components/MenuSelection';
import OrderSidebar from '../components/OrderSidebar';
import OptionModal from '../components/OptionModal';
import { saveOrder } from '../utils/orderStorage';
import { teams } from '../data/menuData';
import './OrderPage.css';

function OrderPage() {
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleOptionConfirm = (menuItem) => {
    setSelectedMenus([...selectedMenus, menuItem]);
    setIsModalOpen(false);
    setSelectedMenu(null);
  };

  const handleRemoveMenu = (index) => {
    setSelectedMenus(selectedMenus.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, change) => {
    const updatedMenus = [...selectedMenus];
    const menu = updatedMenus[index];
    const newQuantity = Math.max(1, menu.quantity + change);
    updatedMenus[index] = {
      ...menu,
      quantity: newQuantity,
      totalPrice: menu.unitPrice * newQuantity
    };
    setSelectedMenus(updatedMenus);
  };

  const totalPrice = selectedMenus.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmit = () => {
    if (!selectedTeam || !name || !employeeId || selectedMenus.length === 0) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    const team = teams.find(t => t.id.toString() === selectedTeam);
    const orderData = {
      teamId: selectedTeam,
      teamName: team ? team.name : selectedTeam,
      name,
      employeeId,
      menus: selectedMenus,
      totalPrice
    };

    saveOrder(orderData);
    
    // 주문 업데이트 이벤트 발생 (주문현황 화면 갱신용)
    window.dispatchEvent(new Event('orderUpdated'));
    
    alert('주문이 완료되었습니다!');
    
    // 주문 후 초기화
    setSelectedMenus([]);
    setSelectedTeam('');
    setName('');
    setEmployeeId('');
  };

  return (
    <div className="order-page">
      <div className="order-content">
        <MenuSelection onMenuSelect={handleMenuSelect} />
        <OrderSidebar
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          name={name}
          onNameChange={setName}
          employeeId={employeeId}
          onEmployeeIdChange={setEmployeeId}
          selectedMenus={selectedMenus}
          onRemoveMenu={handleRemoveMenu}
          onQuantityChange={handleQuantityChange}
          totalPrice={totalPrice}
          onSubmit={handleSubmit}
        />
      </div>
      {selectedMenu && (
        <OptionModal
          menu={selectedMenu}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMenu(null);
          }}
          onConfirm={handleOptionConfirm}
        />
      )}
    </div>
  );
}

export default OrderPage;
