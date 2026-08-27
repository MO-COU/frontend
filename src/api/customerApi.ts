import { http } from '@/lib/http'
import type { CouponIssueReservationResult } from '@/types/domain'

/**
 * 고객이 실제로 부르는 API.
 * 대시보드 목록·재고 조회는 별도 공개 API가 없어 adminApi.listCoupons/getStock을 그대로 쓴다 —
 * 이 프로젝트는 애초에 로그인이 없어서 admin 쪽도 인증으로 막혀 있지 않다.
 */
export const customerApi = {
  // ── issue/CouponIssueReservationController ────────────────
  issue: (couponId: number, memberId: number): Promise<CouponIssueReservationResult> =>
    http.post(`/coupons/${couponId}/issues`, { memberId }).then((res) => res.data),
}
