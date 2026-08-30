/** 실제 사진이 없어 대체한 커피컵 일러스트. */
export function CoffeeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 180" className={className} aria-hidden="true">
      <ellipse cx="100" cy="158" rx="62" ry="10" fill="#F3D9C4" />
      <path
        d="M52 70 h96 l-8 66 a12 12 0 0 1 -12 10 h-56 a12 12 0 0 1 -12 -10 Z"
        fill="#6F4E37"
      />
      <rect x="52" y="70" width="96" height="14" rx="4" fill="#E6007E" />
      <path
        d="M148 84 h14 a16 16 0 0 1 0 32 h-10"
        fill="none"
        stroke="#6F4E37"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <ellipse cx="100" cy="86" rx="40" ry="7" fill="#4A3222" />
      <path
        d="M84 54 c-6 -8 6 -14 0 -24"
        fill="none"
        stroke="#D9B8A3"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M102 50 c-6 -8 6 -16 0 -26"
        fill="none"
        stroke="#D9B8A3"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M118 54 c-6 -8 6 -14 0 -24"
        fill="none"
        stroke="#D9B8A3"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}
