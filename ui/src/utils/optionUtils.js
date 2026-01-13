// 옵션 포맷팅 유틸리티

import { shouldHideTemperature, isDessertMenu } from './menuUtils';

/**
 * 옵션을 읽기 쉬운 문자열로 변환
 * @param {object} options - 옵션 객체
 * @param {object} menu - 메뉴 객체
 * @returns {string} 포맷된 옵션 문자열
 */
export const formatOptions = (options, menu) => {
  if (!options || !menu) return '기본 옵션';
  
  const isDessert = isDessertMenu(menu.category);
  if (isDessert) {
    return '옵션 없음';
  }

  const hideTemp = shouldHideTemperature(menu.name);
  const optionsArray = [
    hideTemp ? null : options.temperature,
    options.size,
    options.shot,
    options.extra
  ].filter(Boolean);

  return optionsArray.length > 0 ? optionsArray.join(', ') : '기본 옵션';
};
