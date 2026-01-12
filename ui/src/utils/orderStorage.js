// 주문 데이터를 localStorage에 저장하고 관리하는 유틸리티

const STORAGE_KEY = 'coffee_orders';

export const saveOrder = (orderData) => {
  const orders = getOrders();
  const newOrder = {
    id: Date.now().toString(),
    ...orderData,
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return newOrder;
};

export const getOrders = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearOrders = () => {
  localStorage.removeItem(STORAGE_KEY);
};
