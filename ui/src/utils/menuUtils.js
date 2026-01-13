// 메뉴 타입 체크 유틸리티

export const MENU_TYPES = {
  ICE_KEYWORDS: ['아이스', '스무디', '설향', '스파클링'],
  DESSERT_CATEGORY: '디저트'
};

/**
 * 아이스 계열 메뉴인지 확인
 * @param {string} menuName - 메뉴 이름
 * @returns {boolean}
 */
export const isIceMenu = (menuName) => {
  if (!menuName) return false;
  return MENU_TYPES.ICE_KEYWORDS.some(keyword => menuName.includes(keyword));
};

/**
 * 디저트 메뉴인지 확인
 * @param {string} category - 메뉴 카테고리
 * @returns {boolean}
 */
export const isDessertMenu = (category) => {
  return category === MENU_TYPES.DESSERT_CATEGORY;
};

/**
 * 온도 옵션을 숨겨야 하는지 확인
 * @param {string} menuName - 메뉴 이름
 * @returns {boolean}
 */
export const shouldHideTemperature = (menuName) => {
  return isIceMenu(menuName);
};

/**
 * 기본 옵션 가져오기
 * @param {object} menu - 메뉴 객체
 * @returns {object} 기본 옵션 객체
 */
export const getDefaultOptions = (menu) => {
  if (!menu) {
    return {
      temperature: 'HOT',
      size: 'Regular',
      shot: '기본',
      extra: '',
      isDessert: false
    };
  }

  const hideTemp = shouldHideTemperature(menu.name);
  const isDessert = isDessertMenu(menu.category);
  
  return {
    temperature: hideTemp ? 'ICE' : 'HOT',
    size: 'Regular',
    shot: '기본',
    extra: '',
    isDessert
  };
};
