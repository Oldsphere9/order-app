import { useState } from 'react';
import { orderAPI } from '../utils/api';
import { teams } from '../data/menuData';
import { findExistingCartItem } from '../utils/cartUtils';
import { showToast } from '../utils/toast';

/**
 * 주문 관련 상태 및 로직을 관리하는 커스텀 훅
 */
export const useOrder = () => {
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 장바구니에 메뉴 추가 (중복 체크 포함)
   */
  const addMenuToCart = (menuItem) => {
    if (!menuItem || !menuItem.menu) return;
    
    const existingItem = findExistingCartItem(
      selectedMenus, 
      menuItem.menu.id, 
      menuItem.options
    );
    
    if (existingItem) {
      // 동일한 메뉴+옵션이 있으면 수량만 증가
      const index = selectedMenus.indexOf(existingItem);
      updateQuantity(index, 1);
    } else {
      // 새로운 아이템 추가
      setSelectedMenus([...selectedMenus, menuItem]);
    }
  };

  /**
   * 장바구니에서 메뉴 제거
   */
  const removeMenu = (index) => {
    if (index < 0 || index >= selectedMenus.length) return;
    setSelectedMenus(selectedMenus.filter((_, i) => i !== index));
  };

  /**
   * 메뉴 수량 변경
   */
  const updateQuantity = (index, change) => {
    if (index < 0 || index >= selectedMenus.length) return;
    
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

  /**
   * 주문 입력 검증
   */
  const validateOrder = () => {
    if (!selectedTeam) {
      showToast('팀을 선택해주세요.', 'error');
      return false;
    }
    if (!name || name.trim() === '') {
      showToast('이름을 입력해주세요.', 'error');
      return false;
    }
    if (!employeeId || employeeId.trim() === '') {
      showToast('사원번호를 입력해주세요.', 'error');
      return false;
    }
    if (selectedMenus.length === 0) {
      showToast('메뉴를 선택해주세요.', 'error');
      return false;
    }
    return true;
  };

  /**
   * 주문 제출
   */
  const submitOrder = async () => {
    if (!validateOrder()) {
      return false;
    }

    if (isSubmitting) {
      showToast('주문 처리 중입니다. 잠시만 기다려주세요.', 'info');
      return false;
    }

    const team = teams.find(t => t.id.toString() === selectedTeam);
    const teamName = team ? team.name : selectedTeam;

    const orderData = {
      team: teamName,
      name: name.trim(),
      employee_id: employeeId.trim(),
      menus: selectedMenus.map(item => ({
        menu_id: item.menu.id,
        quantity: item.quantity,
        options: item.options
      }))
    };

    try {
      setIsSubmitting(true);
      const response = await orderAPI.createOrder(orderData);
      
      if (response.success) {
        showToast('주문이 완료되었습니다!', 'success');
        window.dispatchEvent(new Event('orderUpdated'));
        resetOrder();
        return true;
      } else {
        showToast(response.error || '주문 저장에 실패했습니다.', 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          '주문 저장에 실패했습니다. 다시 시도해주세요.';
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 주문 폼 초기화
   */
  const resetOrder = () => {
    setSelectedMenus([]);
    setSelectedTeam('');
    setName('');
    setEmployeeId('');
  };

  const totalPrice = selectedMenus.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return {
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
    submitOrder,
    resetOrder
  };
};
