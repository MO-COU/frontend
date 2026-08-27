const STORAGE_KEY = 'mocou.customerMemberId'

/** datagen이 심어둔 회원 ID 범위(1~1,000,000)와 맞춘다. 범위 밖이면 발급 API가 404(NOT_MEMBER)를 낸다. */
const MAX_SEEDED_MEMBER_ID = 1_000_000

/**
 * 로그인이 없어 "내가 누구인지"를 서버가 모른다. 브라우저마다 회원 ID를 하나 뽑아 기억해두고
 * 그대로 발급 요청에 실어 보낸다 — 같은 브라우저로 두 번 받으면 1인 1매 방어(DUPLICATE)가
 * 정상적으로 걸리는 걸 보여줄 수 있다.
 */
export function getOrCreateMemberId(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  if (Number.isFinite(parsed) && parsed > 0) return parsed

  const memberId = 1 + Math.floor(Math.random() * MAX_SEEDED_MEMBER_ID)
  localStorage.setItem(STORAGE_KEY, String(memberId))
  return memberId
}
