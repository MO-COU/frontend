import { deriveEventStatus, getFirstNMondaysOfMonth } from '@/lib/dateUtils'
import type {
  ConsistencyCheckBatch,
  CouponEvent,
  CreateEventInput,
  IssueRun,
  IssuedCoupon,
  Page,
} from '@/types/domain'

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

interface EventSeed {
  id: string
  name: string
  startAt: string
  totalStock: number
  /** 종료된 주차는 재고를 다 소진한 것으로, 예정 주차는 그대로 둔다. 진행중 주차만 직접 지정 */
  remainingStockOverride?: number
}

function buildWeeklySeeds(): EventSeed[] {
  const seeds: EventSeed[] = []
  const months: Array<{ year: number; month1: number }> = [
    { year: 2026, month1: 7 },
    { year: 2026, month1: 8 },
  ]

  months.forEach(({ year, month1 }) => {
    const mondays = getFirstNMondaysOfMonth(year, month1, 4)
    mondays.forEach((startAt, idx) => {
      const week = idx + 1
      seeds.push({
        id: `evt-${year}-${String(month1).padStart(2, '0')}-w${week}`,
        name: `${month1}월 ${week}주차 선착순 쿠폰`,
        startAt,
        totalStock: 10000,
      })
    })
  })

  return seeds
}

function toEvent(seed: EventSeed): CouponEvent {
  const status = deriveEventStatus(seed.startAt)
  const remainingStock =
    seed.remainingStockOverride ?? (status === 'CLOSED' ? 0 : seed.totalStock)

  return {
    id: seed.id,
    name: seed.name,
    totalStock: seed.totalStock,
    remainingStock,
    startAt: seed.startAt,
    status,
  }
}

const eventSeeds = buildWeeklySeeds()

/** 데모용으로 "이번 주" 이벤트에는 실행/발급/검증 샘플 데이터를 미리 채워둔다 */
const currentWeekSeed = eventSeeds.find((s) => deriveEventStatus(s.startAt) === 'OPEN')
if (currentWeekSeed) {
  currentWeekSeed.remainingStockOverride = 3210
}

const events: CouponEvent[] = eventSeeds.map(toEvent)

/** 이벤트당 실행은 최대 1건이므로 배열이 아닌 단일 값으로 관리한다 */
const runByEvent: Record<string, IssueRun> = {}
if (currentWeekSeed) {
  runByEvent[currentWeekSeed.id] = {
    runId: `run-${currentWeekSeed.id}`,
    eventId: currentWeekSeed.id,
    status: 'SUCCESS',
    requestedCount: 6790,
    issuedCount: 6790,
    failedCount: 0,
    startedAt: currentWeekSeed.startAt,
    finishedAt: currentWeekSeed.startAt,
  }
}

function makeCoupons(eventId: string, count: number, issuedAtBase: string): IssuedCoupon[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${10_000_000 + i}`,
    eventId,
    userId: `user-${1000 + i}`,
    status: 'ISSUED' as const,
    issuedAt: issuedAtBase,
  }))
}

const couponsByEvent: Record<string, IssuedCoupon[]> = {}
if (currentWeekSeed) {
  couponsByEvent[currentWeekSeed.id] = makeCoupons(currentWeekSeed.id, 42, currentWeekSeed.startAt)
}

/** eventId → 검증 실행(batch) 목록. 이벤트당 실행이 1건뿐이라 eventId로 바로 스코프한다 */
const consistencyBatchesByEvent: Record<string, ConsistencyCheckBatch[]> = {}
if (currentWeekSeed) {
  consistencyBatchesByEvent[currentWeekSeed.id] = [
    {
      batchId: 'batch-1',
      runId: `run-${currentWeekSeed.id}`,
      eventId: currentWeekSeed.id,
      checkedAt: currentWeekSeed.startAt,
      results: [
        {
          id: 'batch-1-stock',
          checkType: 'STOCK_MATCH',
          isConsistent: true,
          expectedValue: 6790,
          actualValue: 6790,
          mismatchDetail: null,
        },
        {
          id: 'batch-1-dup',
          checkType: 'DUPLICATE_ISSUE',
          isConsistent: true,
          expectedValue: 0,
          actualValue: 0,
          mismatchDetail: null,
        },
        {
          id: 'batch-1-state',
          checkType: 'STATE_TRANSITION',
          isConsistent: true,
          expectedValue: 6790,
          actualValue: 6790,
          mismatchDetail: null,
        },
      ],
    },
  ]
}

let batchSeq = 2

export const mockApi = {
  async listEvents(): Promise<CouponEvent[]> {
    // 상태는 "지금" 기준으로 매 조회마다 다시 계산한다 (예정→진행중→종료로 시간에 따라 자연스럽게 전이)
    return delay(events.map((e) => ({ ...e, status: deriveEventStatus(e.startAt) })))
  },

  async getEvent(eventId: string): Promise<CouponEvent | undefined> {
    const event = events.find((e) => e.id === eventId)
    return delay(event ? { ...event, status: deriveEventStatus(event.startAt) } : undefined)
  },

  async createEvent(input: CreateEventInput): Promise<CouponEvent> {
    const event: CouponEvent = {
      id: `evt-custom-${Date.now()}`,
      name: input.name,
      totalStock: input.totalStock,
      remainingStock: input.totalStock,
      startAt: input.startAt,
      status: deriveEventStatus(input.startAt),
    }
    events.push(event)
    return delay(event, 500)
  },

  async getIssueRun(eventId: string): Promise<IssueRun | undefined> {
    return delay(runByEvent[eventId])
  },

  async triggerRun(eventId: string, requestCount: number): Promise<IssueRun> {
    if (runByEvent[eventId]) {
      throw new Error('이 이벤트는 이미 실행되었습니다. 이벤트당 실행은 1회만 가능합니다.')
    }
    const run: IssueRun = {
      runId: `run-${eventId}`,
      eventId,
      status: 'SUCCESS',
      requestedCount: requestCount,
      issuedCount: requestCount,
      failedCount: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    }
    runByEvent[eventId] = run
    return delay(run, 800)
  },

  async listCoupons(
    eventId: string,
    page: number,
    size: number,
  ): Promise<Page<IssuedCoupon>> {
    const all = couponsByEvent[eventId] ?? []
    const start = page * size
    return delay({
      content: all.slice(start, start + size),
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      page,
      size,
    })
  },

  async listConsistencyBatches(eventId: string): Promise<ConsistencyCheckBatch[]> {
    return delay(consistencyBatchesByEvent[eventId] ?? [])
  },

  async runConsistencyCheck(eventId: string): Promise<ConsistencyCheckBatch> {
    const run = runByEvent[eventId]
    if (!run) {
      throw new Error('먼저 발급을 실행해야 정합성 검증을 할 수 있습니다.')
    }
    const expected = run.issuedCount
    const batch: ConsistencyCheckBatch = {
      batchId: `batch-${batchSeq++}`,
      runId: run.runId,
      eventId,
      checkedAt: new Date().toISOString(),
      results: [
        {
          id: `${run.runId}-stock-${Date.now()}`,
          checkType: 'STOCK_MATCH',
          isConsistent: true,
          expectedValue: expected,
          actualValue: expected,
          mismatchDetail: null,
        },
        {
          id: `${run.runId}-dup-${Date.now()}`,
          checkType: 'DUPLICATE_ISSUE',
          isConsistent: true,
          expectedValue: 0,
          actualValue: 0,
          mismatchDetail: null,
        },
        {
          id: `${run.runId}-state-${Date.now()}`,
          checkType: 'STATE_TRANSITION',
          isConsistent: true,
          expectedValue: expected,
          actualValue: expected,
          mismatchDetail: null,
        },
      ],
    }
    consistencyBatchesByEvent[eventId] = [batch, ...(consistencyBatchesByEvent[eventId] ?? [])]
    return delay(batch, 900)
  },
}
