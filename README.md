# MOCOU - Frontend

대규모 트래픽 환경에서 초과 발급 0건 · 1인 1매 · 정합성을 보장하는 선착순 쿠폰 발급 시스템의
**관리자 대시보드**. 로그인 화면 없이 이벤트별 [실행] · [리스트] · [정합성] 검증 화면으로 구성된다.

## 기술 스택

| 구분 | 선택 |
|---|---|
| 언어/빌드 | TypeScript, Vite |
| 프레임워크 | React 19 |
| 라우팅 | React Router |
| 서버 상태 | TanStack Query |
| 테이블 | TanStack Table v8 |
| 스타일 | Tailwind CSS v4 + shadcn 스타일 UI 프리미티브(직접 구현) |
| 차트 | Recharts |
| 폼/검증 | React Hook Form + Zod |
| HTTP | Axios |
| 토스트 | sonner |

## 폴더 구조

```
src/
├── api/
│   └── adminApi.ts          # 관리자 API 진입점. VITE_USE_MOCK에 따라 mock ↔ 실제 axios 호출 분기
│                             # → 실제 API 명세가 나오면 이 파일의 엔드포인트 경로만 교체하면 됨
│
├── mocks/
│   └── data.ts               # 백엔드 없이 화면을 검증하기 위한 목데이터 + 목 API 구현
│
├── types/
│   └── domain.ts             # CouponEvent / IssueRun / IssuedCoupon / ConsistencyCheckBatch 등 DTO 계약
│                             # → 실제 API 명세에 맞춰 갱신 대상
│
├── hooks/                    # TanStack Query 훅 (기능별로 분리, adminApi만 호출)
│   ├── useEvents.ts           # 이벤트 목록/상세 조회, 새 이벤트 생성
│   ├── useIssueRuns.ts        # 이벤트의 실행(최대 1건) 조회, 발급 실행 트리거
│   ├── useCoupons.ts          # 발급 리스트(DB 조회) 페이지네이션
│   └── useConsistencyCheck.ts # 이벤트 단위 정합성 검증 이력 조회 및 실행
│
├── lib/
│   ├── http.ts                # axios 인스턴스 (baseURL: VITE_API_BASE_URL)
│   ├── dateUtils.ts           # KST 기준 "이번 주" 계산, 예정/진행중/종료 상태 도출, 날짜 포맷
│   └── utils.ts               # cn() (clsx + tailwind-merge)
│
├── components/
│   ├── ui/                    # shadcn 스타일 프리미티브 (button, card, table, tabs, dialog, select ...)
│   └── layout/
│       └── AppShell.tsx       # 상단 헤더 + 라우터 Outlet을 감싸는 공통 레이아웃
│
├── features/                  # 도메인별 화면 조각 (페이지에서 조합해서 사용)
│   ├── events/components/
│   │   ├── EventStatusBadge.tsx     # 예정/진행중/종료 배지
│   │   ├── RunStatusBadge.tsx       # 실행 상태 배지
│   │   ├── EventGalleryView.tsx     # 대시보드 갤러리(카드) 뷰
│   │   ├── EventListView.tsx        # 대시보드 리스트(테이블) 뷰
│   │   ├── CreateEventDialog.tsx    # 새 이벤트 생성 폼 다이얼로그
│   │   ├── RunTab.tsx               # [실행] 탭: 동시 요청 수 입력 → 발급 실행(이벤트당 1회) → 실행 결과
│   │   └── ListTab.tsx              # [리스트] 탭: 발급된 쿠폰 DB 조회 테이블
│   └── consistency/components/
│       ├── ConsistencyTab.tsx        # [정합성] 탭: 이 이벤트의 실행을 대상으로 검증 실행 → 검증 이력(N회)
│       └── ConsistencyResultCard.tsx # 검증 1건(재고 일치/1인 1매/상태 전이) 카드 + 막대그래프
│
├── pages/
│   ├── DashboardPage.tsx      # "/" 이벤트 목록 (갤러리 ↔ 리스트 토글, 새 이벤트 생성)
│   └── EventDetailPage.tsx    # "/events/:eventId" 이벤트 상세 (실행/리스트/정합성 탭)
│
├── App.tsx                   # 라우트 정의
├── main.tsx                  # QueryClientProvider, BrowserRouter, Toaster 부트스트랩
└── index.css                 # Tailwind 진입점 + 디자인 토큰(CSS 변수)
```

## 데이터 흐름

```
Page (DashboardPage / EventDetailPage)
  → feature 컴포넌트 (RunTab, ListTab, ConsistencyTab ...)
    → hooks/use*.ts (TanStack Query)
      → api/adminApi.ts
        → VITE_USE_MOCK=true  → mocks/data.ts (메모리 목데이터)
        → VITE_USE_MOCK=false → lib/http.ts (axios) → 실제 백엔드
```

- **화면과 API 연동 지점이 `adminApi.ts` 한 파일로 좁혀져 있어**, 관리자 API 명세서가 확정되면
  이 파일의 엔드포인트/파라미터와 `types/domain.ts`의 DTO만 맞추면 나머지 코드는 그대로 동작한다.
- **이벤트 상태(예정/진행중/종료)는 서버(`coupon.status`)가 관리하는 값을 그대로 쓴다.** 프론트는
  계산하지 않는다 — `lib/dateUtils.ts`의 `deriveEventStatus`는 백엔드 없이 화면을 보기 위해
  `mocks/data.ts`에서만 상태를 흉내내는 용도이고, 실제 API 연동 시엔 사용되지 않는다.
- **"동시 요청 수"는 이벤트에 저장되는 값이 아니다.** 실제 동시 접속자 수는 미리 알 수 없으므로,
  [실행] 탭에서 발급을 트리거할 때마다 입력하는 파라미터로만 존재한다 (부하테스트 도구에 넘기는 값과 같은 성격).
- 정합성 검증은 **발급 실행(`IssueRun.runId`) 단위**로 스코프된다 — 이벤트 전체 누적이 아니라
  "이 실행 1회가 초과발급 없이 정합했는가"를 검증하는 것이 목적이라, 하나의 실행에 대해 여러 번
  검증을 실행할 수 있다 (`ConsistencyCheckBatch`가 검증 1회 실행분, 그 안에 재고 일치 / 1인 1매 /
  상태 전이 3종 결과가 담김). 백엔드 쪽에는 이 매핑을 위해 발급 실행 이력을 저장하는 테이블과,
  `verification_run`이 `coupon_id`가 아니라 그 실행 이력을 가리키는 FK가 필요하다.
- 발급 리스트의 식별자는 별도 "쿠폰 코드" 컬럼 없이 `coupon_issue_id`(`IssuedCoupon.id`)를 그대로 쓴다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173, /api 요청은 localhost:8080으로 프록시
npm run build    # tsc -b && vite build
npm run lint      # oxlint
```

`.env`의 `VITE_USE_MOCK=true`(기본값)면 백엔드 없이 목데이터로 전체 화면이 동작한다.
실제 API 연동 시 `.env`에서 `VITE_USE_MOCK=false`로 바꾸고 `VITE_API_BASE_URL`을 지정한다.
