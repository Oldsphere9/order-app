// 옵션 가격 상수

export const OPTION_PRICES = {
  SIZE: {
    Small: -500,
    Regular: 0,
    Large: 500
  },
  SHOT: {
    기본: 0,
    '+1샷': 500,
    '+2샷': 1000
  },
  EXTRA: {
    '': 0,
    '휘핑크림 추가': 500,
    '시럽 추가': 500
  }
};

/**
 * 옵션을 고려한 최종 가격 계산
 * @param {number} basePrice - 기본 가격
 * @param {object} options - 선택한 옵션
 * @param {boolean} isDessert - 디저트 메뉴 여부
 * @returns {number} 계산된 가격
 */
export const calculateOptionPrice = (basePrice, options, isDessert = false) => {
  if (!basePrice || basePrice < 0) return 0;
  if (isDessert) {
    return basePrice;
  }
  
  let price = basePrice;
  
  // 사이즈 가격 조정
  if (options?.size && OPTION_PRICES.SIZE[options.size] !== undefined) {
    price += OPTION_PRICES.SIZE[options.size];
  }
  
  // 샷 추가 가격 조정
  if (options?.shot && OPTION_PRICES.SHOT[options.shot] !== undefined) {
    price += OPTION_PRICES.SHOT[options.shot];
  }
  
  // 추가 옵션 가격 조정
  if (options?.extra && OPTION_PRICES.EXTRA[options.extra] !== undefined) {
    price += OPTION_PRICES.EXTRA[options.extra];
  }
  
  return Math.max(0, price); // 가격이 음수가 되지 않도록 보장
};
