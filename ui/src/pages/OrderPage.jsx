import React, { useState, useCallback } from 'react';
import MenuSelection from '../components/MenuSelection';
import OrderSidebar from '../components/OrderSidebar';
import OptionModal from '../components/OptionModal';
import { useOrder } from '../hooks/useOrder';
import { getDefaultOptions } from '../utils/menuUtils';
import './OrderPage.css';

function OrderPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  
  const {
    selectedMenus,
    selectedTeam,
    name,
    employeeId,
    isSubmitting,
    totalPrice,
    setSelectedTeam,
    setName,
    setEmployeeId,
    addMenuToCart,
    removeMenu,
    updateQuantity,
    submitOrder
  } = useOrder();

  const handleMenuSelect = useCallback((menu) => {
    if (!menu) return;
    setSelectedMenu(menu);
    setIsModalOpen(true);
  }, []);

  const handleOptionConfirm = useCallback((menuItem) => {
    if (!menuItem || !menuItem.menu) return;
    addMenuToCart(menuItem);
    setIsModalOpen(false);
    setSelectedMenu(null);
  }, [addMenuToCart]);

  const handleRecommendationClick = useCallback((menu) => {
    if (!menu) return;
    
    const defaultOptions = getDefaultOptions(menu);
    const menuItem = {
      menu,
      options: {
        temperature: defaultOptions.temperature,
        size: defaultOptions.size,
        shot: defaultOptions.shot,
        extra: defaultOptions.extra
      },
      quantity: 1,
      unitPrice: menu.base_price || 0,
      totalPrice: menu.base_price || 0
    };
    
    addMenuToCart(menuItem);
  }, [addMenuToCart]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMenu(null);
  }, []);

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
          onRemoveMenu={removeMenu}
          onQuantityChange={updateQuantity}
          totalPrice={totalPrice}
          isSubmitting={isSubmitting}
          onSubmit={submitOrder}
          onRecommendationClick={handleRecommendationClick}
        />
      </div>
      {selectedMenu && (
        <OptionModal
          menu={selectedMenu}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handleOptionConfirm}
        />
      )}
    </div>
  );
}

export default OrderPage;
