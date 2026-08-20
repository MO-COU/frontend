import type { CouponEventStatus } from '@/types/domain'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/** epoch day 0 (1970-01-01) was a Thursday → Mon=0 ... Sun=6 */
function kstWeekday(iso: string): number {
  const epochDay = Math.floor((new Date(iso).getTime() + KST_OFFSET_MS) / DAY_MS)
  return ((epochDay % 7) + 7 + 3) % 7
}

function kstWeekStartEpochDay(date: Date): number {
  const epochDay = Math.floor((date.getTime() + KST_OFFSET_MS) / DAY_MS)
  const weekday = ((epochDay % 7) + 7 + 3) % 7
  return epochDay - weekday
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** "YYYY-MM-DD" (KST 기준 달력일)의 오전 10시 KST를 ISO 문자열로 */
export function kstIsoAt10(year: number, month1: number, day: number): string {
  return `${year}-${pad(month1)}-${pad(day)}T10:00:00+09:00`
}

/** 해당 월(KST 기준)의 월요일 날짜들을 최대 n개까지, 이른 순으로 반환 */
export function getFirstNMondaysOfMonth(year: number, month1: number, n = 4): string[] {
  const daysInMonth = new Date(year, month1, 0).getDate()
  const mondays: string[] = []
  for (let day = 1; day <= daysInMonth && mondays.length < n; day++) {
    const iso = kstIsoAt10(year, month1, day)
    if (kstWeekday(iso) === 0) mondays.push(iso)
  }
  return mondays
}

/**
 * 이벤트 시작 시각이 속한 KST 주(월~일)를 기준으로 상태를 계산한다.
 * - 미래 주 → SCHEDULED(예정)
 * - 이번 주 → OPEN(진행중), 재고 소진 여부와 무관
 * - 지난 주 → CLOSED(종료)
 */
export function deriveEventStatus(
  startAtIso: string,
  now: Date = new Date(),
): CouponEventStatus {
  const eventWeekStart = kstWeekStartEpochDay(new Date(startAtIso))
  const nowWeekStart = kstWeekStartEpochDay(now)
  if (eventWeekStart > nowWeekStart) return 'SCHEDULED'
  if (eventWeekStart === nowWeekStart) return 'OPEN'
  return 'CLOSED'
}

export function formatKstDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** <input type="datetime-local"> 값(로컬 벽시계, 타임존 없음)을 KST 벽시계로 간주해 ISO로 변환 */
export function datetimeLocalToKstIso(value: string): string {
  return `${value}:00+09:00`
}
