import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버에서 응답이 온 경우
      console.error('API 오류:', error.response.data);
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('서버에 연결할 수 없습니다. 요청 URL:', error.config?.url);
      console.error('서버에 연결할 수 없습니다. Base URL:', error.config?.baseURL);
    } else {
      // 요청 설정 중 오류 발생
      console.error('요청 설정 오류:', error.message);
    }
    
    // Network Error인 경우 더 자세한 정보 추가
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('네트워크 오류 상세:', {
        message: error.message,
        code: error.code,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    return Promise.reject(error);
  }
);

// API 함수들
export const menuAPI = {
  // 메뉴 목록 조회
  getMenus: async (params = {}) => {
    const response = await api.get('/menus', { params });
    return response.data;
  },
  
  // 특정 메뉴 조회
  getMenuById: async (id) => {
    const response = await api.get(`/menus/${id}`);
    return response.data;
  },
  
  // 메뉴 업데이트
  updateMenu: async (id, data) => {
    const response = await api.patch(`/menus/${id}`, data);
    return response.data;
  },
};

export const optionAPI = {
  // 옵션 목록 조회
  getOptions: async (params = {}) => {
    const response = await api.get('/options', { params });
    return response.data;
  },
};

export const orderAPI = {
  // 주문 생성
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  // 주문 목록 조회
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  // 주문 통계 조회
  getOrderStats: async () => {
    const response = await api.get('/orders/stats');
    return response.data;
  },
  
  // 특정 주문 삭제
  deleteOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },
  
  // 주문 인원의 모든 주문 삭제
  deleteMemberOrders: async (memberId) => {
    const response = await api.delete(`/orders/member/${memberId}`);
    return response.data;
  },
};

export const memberAPI = {
  // 추천 메뉴 조회
  getRecommendations: async (params = {}) => {
    const response = await api.get('/members/recommendations', { params });
    return response.data;
  },
};

export default api;
