/**
 * 백엔드(com.mocou) 실제 DTO에 1:1로 맞춘 타입.
 * 추측이 아니라 컨트롤러/레코드 원본을 읽고 옮긴 것이므로, 백엔드가 바뀌면 여기도 같이 바꾼다.
 */

/** 모든 응답을 감싸는 공통 봉투 (global/response/ApiResponse.java) */
export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
  traceId: string
  timestamp: string
}

export interface ApiErrorBody {
  code: string
  message: string
}

// ───────────────────────── 쿠폰(회차) 목록 ─────────────────────────
// GET  /api/admin/coupons  → admin/AdminCouponSummary.java
// POST /api/admin/coupons  → coupon/CouponRoundController.java

/**
 * coupon.status.
 * 회차 생성 API는 항상 OPEN으로 만든다 — 오픈 전 발급 차단은 Redis Lua가 하므로 SCHEDULED가 없어도
 * 효과가 같고, 전환 주체가 없으면 동기화 컨슈머가 멈추기 때문이다. SCHEDULED는 시더가 만든 과거
 * 데이터에만 남아 있을 수 있어 타입에는 남겨둔다.
 */
export type CouponStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export interface AdminCouponSummary {
  couponId: number
  name: string
  openAt: string
  closeAt: string
  totalQuantity: number
  status: CouponStatus
}

/**
 * 회차 추가 요청 (coupon/CouponRoundRequest.java).
 * closeAt을 비우면 openAt 당일 23:59:59, name을 비우면 "아메리카노 무료 쿠폰 {N}회차"로 서버가 채운다.
 */
export interface CreateCouponInput {
  totalQuantity: number
  openAt: string
  closeAt?: string
  name?: string
}

/** 회차 추가 응답 (coupon/CouponRoundResponse.java). 응답이 왔다면 Redis 초기화까지 끝난 것이다. */
export interface CreatedCoupon {
  couponId: number
  name: string
  openAt: string
  closeAt: string
  totalQuantity: number
}

// ───────────────────────── 재고 ─────────────────────────
// GET /api/admin/coupons/{couponId}/stock → admin/AdminCouponStock.java

export interface AdminCouponStock {
  couponId: number
  couponName: string
  openAt: string
  totalQuantity: number
  /** 실시간(Redis) 발급 수 = totalQuantity - remainingQuantity */
  issuedQuantity: number
  /** DB에 실제로 적재된 발급 건수 */
  dbIssuedQuantity: number
  /** issuedQuantity - dbIssuedQuantity. Redis→DB 동기화가 아직 안 끝난 건수 */
  syncGapQuantity: number
  /** 실시간(Redis) 잔여 재고 */
  remainingQuantity: number
  status: CouponStatus
  updatedAt: string
}

// ─────────────────────── 발급 리스트 ───────────────────────
// GET /api/admin/coupons/{couponId}/issues → admin/AdminCouponIssuePage.java

/** coupon_issue.status (V5에서 UNISSUED 확정) */
export type CouponIssueStatus = 'UNISSUED' | 'ISSUED' | 'USED' | 'EXPIRED'

export interface AdminCouponIssue {
  issueId: number
  couponId: number
  memberId: number
  /** MaskingUtils로 마스킹되어 내려옴 */
  memberName: string
  memberEmail: string
  memberPhone: string
  status: CouponIssueStatus
  issuedAt: string
  usedAt: string | null
  expiresAt: string
}

export interface AdminCouponIssuePage {
  content: AdminCouponIssue[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

// ──────────────────────── 정합성 검증 ────────────────────────
// POST /api/admin/verifications, GET /api/admin/verifications/{runId}
// → consistency/VerificationRule.java 외

/** 검증 규칙 8종 (consistency/VerificationRule.java) */
export type VerificationRuleName =
  | 'DUPLICATE_ISSUE'
  | 'OVER_ISSUE'
  | 'STOCK_MISMATCH'
  | 'ORPHAN_REFERENCE'
  | 'STATE_TIMESTAMP_MISMATCH'
  | 'HISTORY_MISMATCH'
  | 'TOOL_RELIABILITY'
  | 'REDIS_DB_MISMATCH'

/** 규칙이 끝까지 실행됐는지. FAILED면 위반 0건이어도 "정상"이 아니다 */
export type RuleStatus = 'CHECKED' | 'FAILED'

/** 전체 판정. ERROR는 규칙 실행 실패로 판정 자체가 불가한 경우 */
export type Verdict = 'PASS' | 'FAIL' | 'ERROR'

/** finished_at이 NULL이면 RUNNING (서버가 문자열로 계산해서 내려줌) */
export type VerificationStatus = 'RUNNING' | 'COMPLETED'

/** consistency/ViolationTarget.java */
export type ViolationTargetType =
  | 'COUPON'
  | 'MEMBER'
  | 'COUPON_ISSUE'
  | 'COUPON_ISSUE_HISTORY'
  | 'COUPON_STOCK'
  | 'COUPON_MEMBER_PAIR'

export interface VerificationViolation {
  violationId: number
  targetType: ViolationTargetType
  targetId: number | null
  targetId2: number | null
  detail: string
}

export interface VerificationRuleResult {
  ruleResultId: number
  ruleName: VerificationRuleName
  status: RuleStatus
  checkedCount: number
  violationCount: number
  /** status === 'CHECKED'면 null */
  failureReason: string | null
  violations: VerificationViolation[]
}

export interface VerificationResult {
  runId: number
  /** null이면 DB 전체(더미데이터 포함) 대상 검증 */
  issueRunId: number | null
  status: VerificationStatus
  /** 진행 중이면 null */
  verdict: Verdict | null
  snapshotAt: string | null
  startedAt: string
  finishedAt: string | null
  checkedCount: number
  violationCount: number
  rules: VerificationRuleResult[]
}

export interface VerificationStartResponse {
  runId: number
  message: string
}

// ─────────────────── 발급 결과 + DB 적재 진행 ───────────────────
// GET /api/admin/coupons/{couponId}/issue-result-counts
// → admin/AdminCouponIssueResultCounts.java (PR #126 + #135)

/**
 * Redis Lua가 집계한 발급 결과 누적값과, 그것이 DB까지 내려간 진행 상황.
 *
 * Redis와 DB를 한 스냅샷으로 읽지 않으므로 호출 시점에 따라 짧은 차이가 생긴다.
 * 계산값이 음수가 되면 서버가 0으로 보정한다.
 */
export interface AdminCouponIssueResultCounts {
  couponId: number
  /** reserved + failed */
  totalRequests: number
  /** Redis Lua가 예약을 수락한 누적 횟수 */
  reserved: number
  /** 아래 6개 거절 사유의 합 */
  failed: number
  soldOut: number
  /** 1인 1매가 막아낸 횟수 */
  duplicateIssue: number
  notOpenYet: number
  issueClosed: number
  stockNotInitialized: number
  metadataNotInitialized: number
  /** DB 적재 재시도 한도를 넘겨 Redis 예약을 실제로 원복한 횟수 */
  compensated: number
  /** 해당 쿠폰의 coupon_issue 행 수 */
  dbPersisted: number
  /** max(0, reserved - dbPersisted - compensated) */
  pendingOrRetrying: number
}

// ─────────────────────── 부하테스트 리셋 ───────────────────────
// POST /api/admin/load-test/reset → loadtest/LoadTestResetResult.java
// 파라미터 없음 — 서버가 "현재 OPEN인 쿠폰"을 스스로 찾는다(1개가 아니면 409).

export interface LoadTestResetResult {
  couponId: number
  deletedIssues: number
  deletedHistories: number
  deletedFailureLogs: number
  deletedNotifications: number
  deletedVerificationRuns: number
  /** 삭제 건수가 아니라 복구한 잔여 재고 값 */
  restoredStock: number
}

// ─────────────────────── 부하테스트 실행 ───────────────────────
// loadtest/LoadTestExecutionController.java (POST/GET /api/admin/load-tests)
// 시나리오는 백엔드 enum으로 고정돼 있다. VU·ramp-up은 시나리오에 딸린 값이라 따로 못 보낸다.

export type LoadTestScenario =
  | 'V1_RAMP_20000'
  | 'V2_SPIKE_20000'
  | 'V3_SPIKE_50000'
  | 'V4_RAMP_ONCE_20000'
  | 'V5_RATE_4000_RPS'
  | 'V6_REPEAT_1_TO_3'

/**
 * RUNNING은 k6 실행 중, SYNCING은 k6는 끝났고 Redis→DB 적재를 기다리는 중이다.
 * SUCCESS는 DB 적재까지 확인된 상태 — 이때의 수치만 정합성 비교에 쓸 수 있다.
 */
export type LoadTestRunStatus = 'PENDING' | 'RUNNING' | 'SYNCING' | 'SUCCESS' | 'FAILED'

export interface LoadTestStartRequest {
  couponId: number
  scenario: LoadTestScenario
}

/** coupon_issue_run 한 행 (loadtest/LoadTestRunResponse.java) */
export interface LoadTestRunResponse {
  runId: number
  couponId: number
  scenario: LoadTestScenario
  status: LoadTestRunStatus
  /** 시나리오에 고정된 VU 수. 백엔드 필드명이 vus가 아니라 users다 */
  users: number
  rampUpSeconds: number
  requestedCount: number
  issuedCount: number
  /** soldOut + duplicate + error */
  failedCount: number
  /** 재고 소진으로 거절 */
  soldOutCount: number
  /** 중복 발급으로 거절 */
  duplicateCount: number
  /** 5xx 등 예상 못한 실패 */
  errorCount: number
  /** 응답시간 95백분위(ms). 측정 전 null */
  p95Ms: number | null
  startedAt: string
  /** k6 종료 시각 */
  finishedAt: string | null
  /** Redis Stream 이벤트가 DB에 모두 적재된 시각 */
  dbSyncFinishedAt: string | null
  message: string | null
}

/** 화면 표시용 시나리오 설명. load-test/README.md의 시나리오 표를 그대로 옮겼다. */
export const LOAD_TEST_SCENARIOS: {
  value: LoadTestScenario
  label: string
  users: string
  rampUp: string
  requests: string
  purpose: string
  /** 팀 합의 시나리오(V1~V3)와 비교용 추가 시나리오(V4~V6) 구분 */
  required: boolean
}[] = [
  {
    value: 'V1_RAMP_20000',
    label: 'V1 · 점진 유입 20,000',
    users: '20,000 VU',
    rampUp: '60초',
    requests: '활성 VU가 같은 회원 ID로 반복 요청',
    purpose: '최대 처리량, 중복·품절 방어',
    required: true,
  },
  {
    value: 'V2_SPIKE_20000',
    label: 'V2 · 순간 유입 20,000',
    users: '20,000 VU',
    rampUp: '없음',
    requests: '사용자마다 1회 · 총 20,000건',
    purpose: '공식 동시 요청 조건',
    required: true,
  },
  {
    value: 'V3_SPIKE_50000',
    label: 'V3 · 순간 유입 50,000',
    users: '50,000 VU',
    rampUp: '없음',
    requests: '사용자마다 1회 · 총 50,000건',
    purpose: '더 큰 순간 부하와 5xx 확인',
    required: true,
  },
  {
    value: 'V4_RAMP_ONCE_20000',
    label: 'V4 · 점진 유입 20,000 (1회씩)',
    users: '20,000 VU',
    rampUp: '60초',
    requests: '사용자마다 1회 · 총 20,000건',
    purpose: '실제 사용자형 점진 유입',
    required: false,
  },
  {
    value: 'V5_RATE_4000_RPS',
    label: 'V5 · 요청률 4,000/s',
    users: '4,000 req/s',
    rampUp: '없음',
    requests: '5초 동안 요청률 고정 · 총 20,000건',
    purpose: '요청률 유지와 dropped iteration 확인',
    required: false,
  },
  {
    value: 'V6_REPEAT_1_TO_3',
    label: 'V6 · 사용자별 1~3회 재시도',
    users: '20,000 VU',
    rampUp: '없음',
    requests: '사용자마다 1~3회 · 총 39,999건',
    purpose: '제한적 재시도와 중복 방어',
    required: false,
  },
]

// ─────────────────── 고객용 쿠폰 발급 ───────────────────
// POST /api/coupons/{couponId}/issues → issue/CouponIssueReservationController.java
// 로그인이 없어 memberId를 클라이언트가 들고 있다가 그대로 보낸다.

export type CouponIssueReservationStatus = 'RESERVED'

export interface CouponIssueReservationResult {
  eventId: string
  couponId: number
  memberId: number
  status: CouponIssueReservationStatus
}
