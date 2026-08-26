import { cn } from '@/lib/utils'

/**
 * 하나의 비율을 한계치에 대고 보여주는 미터.
 * 채움은 심각도를 나르고(accent → warning → danger), 빈 트랙은 같은 색의 옅은 단계라
 * 막대 전체에서 상태가 함께 읽힌다.
 */
export function Meter({
  value,
  max,
  className,
  label,
}: {
  value: number
  max: number
  className?: string
  label?: string
}) {
  const safeMax = max > 0 ? max : 1
  const ratio = Math.min(1, Math.max(0, value / safeMax))
  const percent = ratio * 100

  // 소진에 가까울수록 심각도가 올라간다
  const tone =
    ratio >= 1 ? 'var(--destructive)' : ratio >= 0.8 ? 'var(--warning)' : 'var(--primary)'

  return (
    <div
      className={cn('h-3 w-full overflow-hidden rounded-full', className)}
      style={{ backgroundColor: `color-mix(in oklab, ${tone} 15%, var(--background))` }}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%`, backgroundColor: tone }}
      />
    </div>
  )
}
