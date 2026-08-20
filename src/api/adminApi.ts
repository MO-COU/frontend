import { http } from '@/lib/http'
import { mockApi } from '@/mocks/data'
import type {
  ConsistencyCheckBatch,
  CouponEvent,
  CreateEventInput,
  IssueRun,
  IssuedCoupon,
  Page,
} from '@/types/domain'

/**
 * 관리자 API 클라이언트.
 * 실제 엔드포인트 경로는 팀원이 작성 중인 API 명세서가 나오는 대로 아래 경로만 교체하면 된다.
 * VITE_USE_MOCK=true 인 동안은 목데이터로 동작해 백엔드 없이 화면을 검증할 수 있다.
 */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const adminApi = {
  listEvents: (): Promise<CouponEvent[]> =>
    useMock
      ? mockApi.listEvents()
      : http.get('/admin/events').then((res) => res.data),

  getEvent: (eventId: string): Promise<CouponEvent | null> =>
    useMock
      ? mockApi.getEvent(eventId)
      : http.get(`/admin/events/${eventId}`).then((res) => res.data),

  createEvent: (input: CreateEventInput): Promise<CouponEvent> =>
    useMock
      ? mockApi.createEvent(input)
      : http.post('/admin/events', input).then((res) => res.data),

  /** 이벤트당 실행은 최대 1건 — 없으면 null */
  getIssueRun: (eventId: string): Promise<IssueRun | null> =>
    useMock
      ? mockApi.getIssueRun(eventId)
      : http.get(`/admin/events/${eventId}/run`).then((res) => res.data),

  triggerRun: (eventId: string, requestCount: number): Promise<IssueRun> =>
    useMock
      ? mockApi.triggerRun(eventId, requestCount)
      : http
          .post(`/admin/events/${eventId}/run`, { requestCount })
          .then((res) => res.data),

  /** 실행/발급/검증 이력을 모두 지워 이벤트를 다시 실행 가능한 상태로 되돌린다 (테스트 용도) */
  resetEvent: (eventId: string): Promise<void> =>
    useMock
      ? mockApi.resetEvent(eventId)
      : http.delete(`/admin/events/${eventId}/run`).then(() => undefined),

  listCoupons: (eventId: string, page: number, size: number): Promise<Page<IssuedCoupon>> =>
    useMock
      ? mockApi.listCoupons(eventId, page, size)
      : http
          .get(`/admin/events/${eventId}/coupons`, { params: { page, size } })
          .then((res) => res.data),

  /** 이벤트의 실행에 대해 지금까지 실행된 정합성 검증 이력 (1 event : N 검증) */
  listConsistencyBatches: (eventId: string): Promise<ConsistencyCheckBatch[]> =>
    useMock
      ? mockApi.listConsistencyBatches(eventId)
      : http.get(`/admin/events/${eventId}/verifications`).then((res) => res.data),

  /** 이벤트의 실행에 대해 정합성 검증을 새로 1회 실행 */
  runConsistencyCheck: (eventId: string): Promise<ConsistencyCheckBatch> =>
    useMock
      ? mockApi.runConsistencyCheck(eventId)
      : http.post(`/admin/events/${eventId}/verifications`).then((res) => res.data),
}
