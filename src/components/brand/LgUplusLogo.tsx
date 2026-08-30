import { cn } from '@/lib/utils'

/** 실제 로고 파일이 없어 워드마크로 대체 표현. LG U+ 브랜드 컬러(마젠타 핑크)만 맞춤. */
export function LgUplusLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 font-bold leading-none tracking-tight', className)}>
      <span className="rounded-md bg-[#E6007E] px-1.5 py-0.5 text-white">LG U+</span>
    </div>
  )
}
