import { cn } from '@/lib/utils'

export interface MeterSegment {
  label: string
  value: number
  /** CSS 색상값. 상태를 나르므로 범례의 라벨과 반드시 같이 쓴다 */
  color: string
}

/**
 * 전체 대비 구성을 한 줄로 보여주는 스택 미터.
 *
 * 세그먼트 사이에 배경색 2px을 넣어 인접한 색이 맞붙지 않게 한다. 붙여 두면 경계가 사라져
 * 색이 비슷한 두 구간을 한 덩어리로 읽는다.
 *
 * 색만으로 구분하지 않는다 — 범례에 라벨과 수치를 항상 함께 낸다.
 */
export function StackedMeter({
  segments,
  total,
  className,
}: {
  segments: MeterSegment[]
  total: number
  className?: string
}) {
  const safeTotal = total > 0 ? total : 0
  const visible = segments.filter((segment) => segment.value > 0)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={segments
          .map((segment) => `${segment.label} ${segment.value.toLocaleString()}`)
          .join(', ')}
      >
        {safeTotal > 0 &&
          visible.map((segment, index) => (
            <div
              key={segment.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(segment.value / safeTotal) * 100}%`,
                backgroundColor: segment.color,
                marginLeft: index === 0 ? undefined : 2,
              }}
            />
          ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium tabular-nums">
              {segment.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
