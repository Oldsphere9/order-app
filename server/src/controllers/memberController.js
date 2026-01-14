import * as memberModel from '../models/memberModel.js';
import * as memberMenuPreferenceModel from '../models/memberMenuPreferenceModel.js';

// 추천 메뉴 조회 (요일 및 시간대 기반)
export const getRecommendations = async (req, res, next) => {
  try {
    const { team, name, employee_id, limit = 1 } = req.query;

    // 필수 파라미터 검증
    if (!team || !name || !employee_id) {
      return res.status(400).json({
        success: false,
        error: '팀, 이름, 사원번호는 필수 입력 항목입니다.',
        code: 'INVALID_INPUT'
      });
    }

    // 멤버 조회
    const member = await memberModel.getMemberByEmployeeId(employee_id);

    if (!member) {
      // 멤버가 없는 경우 빈 배열 반환
      console.log(`[추천 메뉴] 멤버 없음 - 사원번호: ${employee_id}`);
      return res.json([]);
    }

    console.log(`[추천 메뉴] 멤버 조회 성공 - ID: ${member.id}, 팀: ${member.team}, 이름: ${member.name}`);

    // 팀과 이름이 일치하는지 확인
    if (member.team !== team || member.name !== name) {
      console.log(`[추천 메뉴] 팀/이름 불일치 - 요청: ${team}/${name}, DB: ${member.team}/${member.name}`);
      return res.json([]);
    }

    // 현재 시간 기준으로 요일과 시간대 계산 (한국 시간대)
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const dayOfWeek = koreaTime.getDay(); // 0(일요일) ~ 6(토요일)
    const hour = koreaTime.getHours();
    const timeSlot = memberMenuPreferenceModel.getTimeSlot(hour);

    // 추천 메뉴 조회 (요일 및 시간대 패턴 기반, closed_orders 포함)
    const recommendations = await memberMenuPreferenceModel.getPreferencesByMemberIdWithHistory(
      member.id,
      dayOfWeek,
      timeSlot,
      parseInt(limit) || 1
    );

    console.log(`[추천 메뉴] 멤버 ID: ${member.id}, 요일: ${dayOfWeek}, 시간대: ${timeSlot}, 추천 개수: ${recommendations.length}`);
    
    res.json(recommendations);
  } catch (error) {
    console.error('[추천 메뉴] 에러 발생:', error);
    next(error);
  }
};
