/**
 * 관리자 API 명세가 확정되면 이 파일을 실제 스펙에 맞춰 갱신한다.
 * 현재는 backend README(팀 B/A 도메인: coupon, issue, lifecycle, consistency)를 기준으로 한 임시 계약이다.
 */

/** 예정(미래 주) / 진행중(이번 주, 소진 여부 무관) / 종료(지난 주) */
export type CouponEventStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export interface CouponEvent {
  id: string
  name: string
  totalStock: number
  remainingStock: number
  startAt: string
  /** 서버(coupon.status)가 관리하는 값. 프론트에서 다시 계산하지 않고 그대로 사용한다 */
  status: CouponEventStatus
}

export interface CreateEventInput {
  name: string
  totalStock: number
  startAt: string
}

export type IssueRunStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

/**
 * 발급 실행(부하테스트) 결과. 이벤트당 최대 1회만 실행할 수 있다(1 event : 1 run) —
 * 그래서 이벤트(coupon_id)와 실행이 사실상 동일한 대상을 가리키고, 정합성 검증도
 * 별도 실행 이력 테이블 없이 이벤트 단위로 스코프될 수 있다.
 * requestedCount(동시 요청 수)는 이벤트에 저장된 값이 아니라 실행 시점에 입력하는 파라미터다
 * — 실제 동시 접속자 수는 미리 알 수 없기 때문.
 */
export interface IssueRun {
  runId: string
  eventId: string
  status: IssueRunStatus
  requestedCount: number
  issuedCount: number
  failedCount: number
  startedAt: string
  finishedAt: string | null
}

export type IssuedCouponStatus = 'ISSUED' | 'USED' | 'EXPIRED' | 'CANCELLED'

export interface IssuedCoupon {
  /** coupon_issue_id. 별도 쿠폰 코드 컬럼 없이 이 값을 식별자로 사용한다 */
  id: string
  eventId: string
  userId: string
  status: IssuedCouponStatus
  issuedAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

/** 정합성 검증 3종: 재고 일치 / 중복 발급(1인 1매) / 상태 전이 무결성 */
export type ConsistencyCheckType = 'STOCK_MATCH' | 'DUPLICATE_ISSUE' | 'STATE_TRANSITION'

export interface ConsistencyCheckResult {
  id: string
  checkType: ConsistencyCheckType
  isConsistent: boolean
  expectedValue: number
  actualValue: number
  mismatchDetail: string | null
}

/**
 * 하나의 발급 실행(IssueRun.runId)을 대상으로 한 정합성 검증 1회 실행분.
 * 이벤트당 실행이 1개뿐이므로 runId는 사실상 eventId와 1:1이다.
 * 같은 runId에 대해 검증을 여러 번 실행할 수 있다(1 run : N 검증).
 */
export interface ConsistencyCheckBatch {
  batchId: string
  runId: string
  eventId: string
  checkedAt: string
  results: ConsistencyCheckResult[]
}
