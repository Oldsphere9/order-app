// 장바구니 유틸리티 함수

/**
 * 장바구니 아이템의 고유 키 생성
 * @param {number} menuId - 메뉴 ID
 * @param {object} options - 옵션 객체
 * @returns {string} 고유 키
 */
export const generateCartItemKey = (menuId, options) => {
  if (!menuId || !options) return '';
  
  const optionsKey = [
    options.temperature || '',
    options.size || '',
    options.shot || '',
    options.extra || ''
  ].join('|');
  
  return `${menuId}_${optionsKey}`;
};

/**
 * 장바구니에서 동일한 메뉴+옵션 조합 찾기
 * @param {array} cart - 장바구니 배열
 * @param {number} menuId - 메뉴 ID
 * @param {object} options - 옵션 객체
 * @returns {object|null} 찾은 아이템 또는 null
 */
export const findExistingCartItem = (cart, menuId, options) => {
  if (!Array.isArray(cart) || !menuId || !options) return null;
  
  const targetKey = generateCartItemKey(menuId, options);
  
  return cart.find(item => {
    if (!item.menu || !item.options) return false;
    const itemKey = generateCartItemKey(item.menu.id, item.options);
    return itemKey === targetKey;
  });
};
