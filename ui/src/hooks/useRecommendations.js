import { useState, useEffect } from 'react';
import { memberAPI } from '../utils/api';
import { teams } from '../data/menuData';

/**
 * 추천 메뉴 조회를 관리하는 커스텀 훅
 * @param {string} selectedTeam - 선택된 팀 ID
 * @param {string} name - 이름
 * @param {string} employeeId - 사원번호
 * @returns {object} 추천 메뉴 목록과 로딩 상태
 */
export const useRecommendations = (selectedTeam, name, employeeId) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // 필수 정보가 없으면 조회하지 않음
      if (!selectedTeam || !name || !employeeId) {
        setRecommendations([]);
        return;
      }

      const team = teams.find(t => t.id.toString() === selectedTeam);
      const teamName = team ? team.name : selectedTeam;

      try {
        setLoading(true);
        const data = await memberAPI.getRecommendations({
          team: teamName,
          name: name.trim(),
          employee_id: employeeId.trim(),
          limit: 1
        });
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('추천 메뉴 조회 실패:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    // 디바운싱: 입력이 완료된 후 500ms 후에 조회
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedTeam, name, employeeId]);

  return { recommendations, loading };
};
