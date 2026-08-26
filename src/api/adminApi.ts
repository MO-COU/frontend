import { http } from '@/lib/http'
import type {
  AdminCouponIssuePage,
  AdminCouponStock,
  AdminCouponSummary,
  CouponIssueRun,
  CreateCouponInput,
  CreatedCoupon,
  LoadTestResetResult,
  StartLoadTestInput,
  VerificationResult,
  VerificationStartResponse,
} from '@/types/domain'

/**
 * 관리자 API 클라이언트.
 * 경로는 백엔드 컨트롤러(@RequestMapping)를 그대로 옮긴 것이다.
 * 응답 봉투(ApiResponse)는 lib/http.ts 인터셉터가 이미 벗겨서 알맹이만 들어온다.
 */
export const adminApi = {
  // ── 쿠폰(회차) 목록/생성 ──────────────────────────────────
  listCoupons: (): Promise<AdminCouponSummary[]> =>
    http.get('/admin/coupons').then((res) => res.data ?? []),

  /** coupon/CouponRoundController. 201과 함께 Redis 초기화까지 끝난 회차가 돌아온다. */
  createCoupon: (input: CreateCouponInput): Promise<CreatedCoupon> =>
    http.post('/admin/coupons', input).then((res) => res.data),

  // ── admin/AdminCouponController ──────────────────────────
  getStock: (couponId: number): Promise<AdminCouponStock> =>
    http.get(`/admin/coupons/${couponId}/stock`).then((res) => res.data),

  getIssues: (couponId: number, page: number, size: number): Promise<AdminCouponIssuePage> =>
    http
      .get(`/admin/coupons/${couponId}/issues`, { params: { page, size } })
      .then((res) => res.data),

  // ── consistency/VerificationController ───────────────────
  /**
   * 검증을 시작하고 runId만 받는다(202). 결과는 getVerification으로 폴링한다.
   * issueRunId를 주면 그 발급 실행만, 비우면 더미데이터 포함 DB 전체를 검증한다.
   */
  startVerification: (issueRunId?: number): Promise<VerificationStartResponse> =>
    http
      .post('/admin/verifications', null, {
        params: issueRunId != null ? { issueRunId } : undefined,
      })
      .then((res) => res.data),

  getVerification: (runId: number): Promise<VerificationResult> =>
    http.get(`/admin/verifications/${runId}`).then((res) => res.data),

  // ── loadtest/LoadTestResetController ─────────────────────
  /** 되돌릴 회차를 지정한다. 종료된 회차는 LOAD_TEST_TARGET_CLOSED(409)로 거부된다. */
  resetLoadTest: (couponId: number): Promise<LoadTestResetResult> =>
    http
      .post('/admin/load-test/reset', null, { params: { couponId } })
      .then((res) => res.data),

  // ── 부하테스트 실행 (⚠️ 백엔드 미구현) ──────────────────────
  // 요청 필드는 V8 마이그레이션의 조건 컬럼(scenario_version, vus, ramp_up_seconds)을 따랐다.
  // 실제 엔드포인트가 확정되면 아래 두 경로만 바꾸면 된다.
  startLoadTest: (couponId: number, input: StartLoadTestInput): Promise<CouponIssueRun> =>
    http.post(`/admin/coupons/${couponId}/load-test`, input).then((res) => res.data),

  /** 이 쿠폰의 가장 최근 실행. 실행 이력이 없으면 null */
  getLatestLoadTest: (couponId: number): Promise<CouponIssueRun | null> =>
    http.get(`/admin/coupons/${couponId}/load-test/latest`).then((res) => res.data ?? null),
}
