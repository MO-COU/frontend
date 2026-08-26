/**
 * 백엔드는 LocalDateTime을 타임존 없는 문자열("2026-08-26T10:00:00")로 내려준다.
 * 서버가 Asia/Seoul로 동작하므로 그 값을 KST 벽시계 시각으로 읽는다.
 */
function toDate(value: string): Date {
  // 타임존 표기가 없으면 KST로 간주한다. 브라우저 로컬 타임존에 따라 값이 밀리는 것을 막는다.
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}+09:00`)
}

/**
 * <input type="datetime-local">이 주는 "2026-08-26T10:00"을 백엔드 LocalDateTime 형식으로 맞춘다.
 * 타임존을 붙이지 않는다 — 서버가 Asia/Seoul로 돌아 벽시계 값을 그대로 받는다.
 */
export function toLocalDateTimeString(datetimeLocalValue: string): string {
  return datetimeLocalValue.length === 16
    ? `${datetimeLocalValue}:00`
    : datetimeLocalValue
}

export function formatKstDateTime(value: string): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
