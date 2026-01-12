import React, { useState } from 'react';
import MenuSelection from '../components/MenuSelection';
import OrderSidebar from '../components/OrderSidebar';
import OptionModal from '../components/OptionModal';
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

    const orderData = {
      teamId: selectedTeam,
      teamName: selectedTeam,
      name,
      employeeId,
      menus: selectedMenus,
      totalPrice
    };

    console.log('주문 데이터:', orderData);
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
