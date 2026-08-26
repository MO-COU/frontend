const STORAGE_KEY = 'mocou.lastCouponId'

/** 목록 API가 없어서, 마지막으로 본 쿠폰을 기억해 다음 방문에 기본값으로 쓴다 */
export function readLastCouponId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function rememberCouponId(couponId: number): void {
  localStorage.setItem(STORAGE_KEY, String(couponId))
}
