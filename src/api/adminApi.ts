import { http } from '@/lib/http'
import type {
  AdminCouponIssuePage,
  AdminCouponIssueResultCounts,
  AdminCouponStock,
  AdminCouponSummary,
  CreateCouponInput,
  CreatedCoupon,
  LoadTestResetResult,
  LoadTestRunResponse,
  LoadTestStartRequest,
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

  /** Redis 발급 결과 누적값 + DB 적재 진행 (PR #126, #135) */
  getIssueResultCounts: (couponId: number): Promise<AdminCouponIssueResultCounts> =>
    http.get(`/admin/coupons/${couponId}/issue-result-counts`).then((res) => res.data),

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

  // ── loadtest/LoadTestExecutionController ─────────────────
  /**
   * k6 실행을 요청하고 runId가 담긴 실행 기록을 받는다(202). 결과는 getLoadTestRun으로 폴링한다.
   * 실행 중인 테스트가 이미 있거나(409) 대상 회차가 발급 전 초기 상태가 아니면 거부된다.
   */
  startLoadTest: (input: LoadTestStartRequest): Promise<LoadTestRunResponse> =>
    http.post('/admin/load-tests', input).then((res) => res.data),

  getLoadTestRun: (runId: number): Promise<LoadTestRunResponse> =>
    http.get(`/admin/load-tests/${runId}`).then((res) => res.data),
}
