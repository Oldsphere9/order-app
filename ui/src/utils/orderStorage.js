// 주문 데이터를 localStorage에 저장하고 관리하는 유틸리티

const STORAGE_KEY = 'coffee_orders';

export const saveOrder = (orderData) => {
  try {
    const orders = getOrders();
    const newOrder = {
      id: Date.now().toString(),
      ...orderData,
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return newOrder;
  } catch (error) {
    console.error('주문 저장 실패:', error);
    throw new Error('주문 저장에 실패했습니다. 브라우저 저장소를 확인해주세요.');
  }
};

export const getOrders = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('주문 데이터 로드 실패:', error);
    // 데이터가 손상된 경우 빈 배열 반환
    return [];
  }
};

export const clearOrders = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('주문 데이터 삭제 실패:', error);
  }
};
