# MOCOU - Frontend

대규모 트래픽 환경에서 초과 발급 0건 · 1인 1매 · 정합성을 보장하는 선착순 쿠폰 발급 시스템의
프론트엔드. **화면이 둘이다** — 로그인 없이 쿠폰을 받는 **고객용**(`/shop`)과, 쿠폰
생성·부하테스트·발급 리스트·정합성 검증을 다루는 **관리자용**(`/`). 상단 헤더 오른쪽 버튼으로
서로 오갈 수 있다.

## 기술 스택

| 구분 | 선택 |
|---|---|
| 언어/빌드 | TypeScript, Vite |
| 프레임워크 | React 19 |
| 라우팅 | React Router |
| 서버 상태 | TanStack Query (폴링) |
| 스타일 | Tailwind CSS v4 + shadcn 스타일 UI 프리미티브(직접 구현) |
| HTTP | Axios |
| 토스트 | sonner |

## 폴더 구조

```
src/
├── api/
│   ├── adminApi.ts             # 관리자 API. 경로는 백엔드 컨트롤러를 그대로 옮긴 것
│   └── customerApi.ts          # 고객 API. 발급 예약 하나뿐 (목록/재고는 adminApi 재사용)
│
├── types/
│   └── domain.ts               # 백엔드 DTO(record)에 1:1로 맞춘 타입. LOAD_TEST_SCENARIOS(V1~V6) 포함
│
├── hooks/                      # TanStack Query 훅
│   ├── useCoupons.ts            # 쿠폰 목록 조회 / 생성 (관리자·고객 대시보드 공용)
│   ├── useStock.ts              # 실시간 재고 폴링 (부하테스트 중 1초, 평소 5초)
│   ├── useIssues.ts             # [리스트] 탭 발급 이력 페이지네이션
│   ├── useIssueResultCounts.ts  # Redis 발급 결과 집계 + DB 적재 진행 폴링
│   ├── useLoadTest.ts           # 부하테스트 실행/최근 실행 조회/초기화 (쿠폰별 runId 기억)
│   ├── useVerification.ts       # 정합성 검증 시작 + 완료까지 2초 폴링 (쿠폰별 runId 기억)
│   └── useCustomerIssue.ts      # 고객 쿠폰 발급 mutation
│
├── lib/
│   ├── http.ts                  # axios + ApiResponse 봉투 해제 + ApiError 변환
│   ├── dateUtils.ts             # 타임존 없는 LocalDateTime을 KST로 읽어 포맷 (날짜/시각 분리 포맷 포함)
│   ├── lastCoupon.ts            # 관리자가 마지막으로 본 couponId 기억 (목록 실패 시 폴백용)
│   ├── memberId.ts              # 고객 브라우저별 memberId를 하나 뽑아 localStorage에 고정
│   └── utils.ts                 # cn() (clsx + tailwind-merge)
│
├── components/
│   ├── ui/                      # shadcn 스타일 프리미티브 (button, card, table, tabs, dialog, meter ...)
│   └── layout/
│       ├── AppShell.tsx          # 관리자 상단 헤더("MOCOU Admin" + 고객 화면 버튼) + Outlet
│       └── CustomerShell.tsx     # 고객 상단 헤더("MOCOU" + 관리자 화면 버튼) + Outlet
│
├── features/
│   ├── coupon/components/
│   │   ├── CouponGalleryView.tsx    # 관리자 대시보드 갤러리(카드) 뷰
│   │   ├── CouponListView.tsx       # 관리자 대시보드 리스트(테이블) 뷰
│   │   ├── CreateCouponDialog.tsx   # 쿠폰 추가 폼 (종료일시·이름은 선택)
│   │   ├── StockPanel.tsx           # 실시간 재고: 히어로 수치 + 미터 + KPI 타일 4개
│   │   └── CouponStatusBadge.tsx    # SCHEDULED / OPEN / CLOSED
│   ├── loadtest/components/
│   │   ├── LoadTestTab.tsx          # [실행] 탭: 시나리오 6종(V1~V6) 중 택1 드롭다운, 시작·초기화, 결과
│   │   ├── IssueResultPanel.tsx     # Redis 발급 집계 + DB 적재 진행 (거절 사유 내역 포함)
│   │   └── RunStatusBadge.tsx       # PENDING / RUNNING / SYNCING / SUCCESS / FAILED
│   ├── issues/components/
│   │   ├── IssueListTab.tsx         # [리스트] 탭: 발급 건(회원정보는 서버에서 마스킹되어 옴)
│   │   └── IssueStatusBadge.tsx     # UNISSUED / ISSUED / USED / EXPIRED
│   └── consistency/components/
│       ├── ConsistencyTab.tsx       # [정합성] 탭: 검증 실행(단일 버튼) → 폴링 → 규칙별 결과
│       ├── RuleResultCard.tsx       # 규칙 1종 결과 + 위반 상세 드릴다운
│       └── VerdictBadge.tsx         # PASS / FAIL / ERROR / 진행중
│
├── pages/
│   ├── DashboardPage.tsx           # "/" 관리자 쿠폰 목록 (기간 필터, 갤러리↔리스트, 쿠폰 추가)
│   ├── CouponDetailPage.tsx        # "/coupons/:couponId" 재고 패널 + [실행]/[리스트]/[정합성] 탭
│   └── customer/
│       ├── CustomerDashboardPage.tsx # "/shop" 예정·진행중 쿠폰 카드 스택 (종료 회차는 숨김)
│       └── CustomerCouponPage.tsx    # "/shop/coupons/:couponId" 발급 화면, [쿠폰 받기] 버튼
│
├── App.tsx / main.tsx / index.css
```

## 라우팅

| 경로 | 레이아웃 | 화면 |
|---|---|---|
| `/` | `AppShell` | 관리자 대시보드 |
| `/coupons/:couponId` | `AppShell` | 관리자 쿠폰 상세 (실행/리스트/정합성) |
| `/shop` | `CustomerShell` | 고객 대시보드 (카드 스택) |
| `/shop/coupons/:couponId` | `CustomerShell` | 고객 발급 화면 |
| 그 외 | — | `/`로 리다이렉트 |

두 레이아웃 다 인증이 없다 — 헤더의 버튼(관리자 → "고객 화면 보기", 고객 → "관리자 화면")으로
그냥 오갈 뿐, 접근 제어는 없다.

## 연동한 백엔드 API

| 화면 | Method + Path | 백엔드 |
|---|---|---|
| 대시보드 목록 (관리자·고객 공용) | `GET /api/admin/coupons` | `admin/AdminCouponController` |
| 쿠폰 추가 | `POST /api/admin/coupons` | `coupon/CouponRoundController` |
| 재고 조회 (관리자 패널·고객 발급 화면 공용) | `GET /api/admin/coupons/{couponId}/stock` | `admin/AdminCouponController` |
| [리스트] | `GET /api/admin/coupons/{couponId}/issues?page=&size=` | 〃 |
| [실행] 발급 결과 집계 | `GET /api/admin/coupons/{couponId}/issue-result-counts` | 〃 |
| [정합성] 시작 | `POST /api/admin/verifications?issueRunId=` | `consistency/VerificationController` |
| [정합성] 조회 | `GET /api/admin/verifications/{runId}` | 〃 |
| [실행] 초기화 | `POST /api/admin/load-test/reset?couponId=` | `loadtest/LoadTestResetController` |
| [실행] 시작 | `POST /api/admin/load-tests` `{couponId, scenario}` | `loadtest/LoadTestExecutionController` |
| [실행] 상태 조회 | `GET /api/admin/load-tests/{runId}` | 〃 |
| **고객 쿠폰 발급** | `POST /api/coupons/{couponId}/issues` `{memberId}` | `issue/CouponIssueReservationController` |

`POST /api/coupon-issues/{issueId}/use`(쿠폰 사용 처리)는 화면이 없어 연동하지 않았다.

## 알아둘 것 — 공통

- **모든 응답은 `ApiResponse` 봉투**(`{success, data, error, traceId, timestamp}`)로 온다.
  `lib/http.ts` 인터셉터가 한 번만 벗겨내므로, API 함수와 화면은 알맹이만 다룬다.
  에러는 백엔드 `ErrorCode`를 담은 `ApiError`로 바뀌어 던져진다.
- **"이 쿠폰의 최근 실행"을 알려주는 목록 API가 없다.** 부하테스트(`useLoadTest`)와 정합성 검증
  (`useVerification`) 둘 다, 시작시킨 `runId`를 **쿠폰별로 나눠** localStorage에 기억해뒀다가
  그 ID로 상태를 폴링한다 (`mocou.lastLoadTestRunId.{couponId}`,
  `mocou.lastVerificationRunId.{couponId}`). 여러 컴포넌트가 같은 값을 봐야 해서 `useState` 대신
  TanStack Query 캐시에 얹었다 — 컴포넌트마다 `useState`를 두면 한쪽에서 갱신해도 나머지가 옛
  값을 들고 있게 된다.

## 알아둘 것 — 관리자 화면

- **쿠폰 생성 요청은 `{ totalQuantity, openAt, closeAt?, name? }`다.** `closeAt`을 비우면 오픈 당일
  23:59:59, `name`을 비우면 서버가 채운다. 응답이 왔다는 것은 Redis 초기화까지 끝났다는 뜻이라
  바로 발급이 가능하다.
- **부하테스트 시나리오는 6종(V1~V6)으로 고정돼 있다** (`types/domain.ts`의
  `LOAD_TEST_SCENARIOS`). VU·ramp-up을 자유 입력받지 않고 시나리오 하나를 고르면 그 값 그대로
  k6에 전달된다. 대상 쿠폰은 OPEN 상태면서 발급 이력이 없어야 한다.
- **실행 상태는 4단계다**: `RUNNING`(k6 실행 중) → `SYNCING`(k6는 끝났고 Redis→DB 비동기 적재를
  기다리는 중) → `SUCCESS`/`FAILED`. `SYNCING` 동안의 수치는 아직 DB에 다 반영되지 않은 상태라
  정합성 비교에 쓸 수 없다.
- **정합성 검증은 `issueRunId`를 줘도 검사 범위를 좁히지 않는다.** 백엔드가 그 값을 어디에도
  필터 조건으로 쓰지 않고, `verification_run` 행에 "이 부하테스트 직후에 돈 검증"이라는 시점
  태그로만 남긴다 — 실제 검사는 항상 DB 전체(더미데이터 포함 약 300만 건)다. 그래서 버튼은
  하나(`정합성 검증 실행`)뿐이고, 최근 부하테스트가 있으면 그 `runId`를 조용히 같이 보내
  결과 카드에 `발급 실행 #M 직후 실행됨`으로만 표시한다.
- **정합성 검증은 비동기다.** `POST`는 `runId`만 주고 202로 끝나며, 완료까지 1~2분 걸린다.
  탭이 숨어도 폴링이 멈추지 않도록 `refetchIntervalInBackground: true`를 켜뒀다.
- **초기화(`load-test/reset`)는 검증 이력까지 지운다.** 그래서 들고 있던 `runId`가 죽을 수
  있는데, `VERIFICATION_RUN_NOT_FOUND`/부하테스트 404가 오면 에러를 띄우는 대신 조용히 버린다.
  종료된 회차를 초기화 대상으로 지목하면 `LOAD_TEST_TARGET_CLOSED`(409)로 거부된다.
- **대시보드 기간 필터**(최근 1개월/최근 1년/전체)는 목록 API에 필터 파라미터가 없어
  `openAt` 기준으로 클라이언트에서 걸러낸다. 기본값은 `전체`.
- **발급 결과는 Redis 누적 집계다.** `reserved`(Lua가 수락) / `failed`(거절 6종) /
  `dbPersisted`(실제 coupon_issue 행) / `pendingOrRetrying`(아직 DB 미반영) /
  `compensated`(예약 원복)를 나눠 보여준다. 거절은 시스템이 제대로 막은 결과라 붉게 칠하지
  않는다 — 재고 소진은 초과 발급을, 중복 발급은 1인 1매를 막았다는 증거다.
- **local 프로필은 동기화 컨슈머가 꺼져 있다**(`mocou.issue.sync.enabled`는 prod에서만 true).
  그래서 로컬에서는 `dbPersisted`가 0에 머물고 `pendingOrRetrying`이 줄지 않는다. 버그가 아니다.

## 알아둘 것 — 고객 화면

- **로그인이 없다.** "내가 누구인지"를 서버가 모르는 채로 발급 API(`{memberId}`)를 불러야 해서,
  `lib/memberId.ts`가 브라우저마다 회원 ID를 하나 뽑아 localStorage에 고정해두고 그대로 실어
  보낸다. 같은 브라우저로 두 번 받으면 서버의 1인 1매 방어(`DUPLICATE`)가 그대로 걸린다.
  뽑는 범위(1~1,000,000)는 datagen이 심어둔 회원 ID 범위와 맞춘 것이라, 이 범위를 벗어나면
  `NOT_MEMBER`(404)가 난다.
- **대시보드엔 `CLOSED` 회차를 안 보여준다.** 목록 API가 과거 회차까지 전부 내려주므로,
  `CustomerDashboardPage`가 `SCHEDULED`/`OPEN`만 클라이언트에서 걸러 카드로 보여준다.
- **[쿠폰 받기] 버튼은 재고와 상태로만 활성화 여부를 정한다.** `stock.status === 'OPEN' &&
  stock.remainingQuantity > 0`일 때만 눌리고, 그 외엔 회색으로 비활성화되며 이유를 라벨로
  보여준다(`아직 발급 전입니다` / `발급이 종료되었습니다` / `품절되었습니다`).
- 발급 성공/실패 토스트 메시지는 서버가 이미 사람이 읽을 문장으로 내려주는 걸 그대로 쓴다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173, /api 요청은 localhost:8080으로 프록시
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

백엔드가 함께 떠 있어야 한다 (`cd ../backend && ./gradlew bootRun`, MySQL/Redis는 docker compose).

## 배포 (수동)

프론트는 CI가 없어서 로컬 dev 서버가 EC2 백엔드를 보도록 함 — `vite.config.ts`의 proxy target을
`http://localhost:8080`에서 app-ec2 주소로 바꾸면 저장할 때마다 HMR로 즉시 반영된다.
`npm run deploy`(`scripts/deploy.sh`)는 **팀원에게 보여줘야 할 때만** 손으로 돌린다.

app-ec2는 `KeyName: None`으로 떠 있다 — EC2에서 발급한 키 페어가 없다. 그래서 22번 포트를
열고 `.pem`으로 붙는 대신, **SSM 세션을 SSH 터널로 쓴다.** 보안그룹에 22를 열 필요가 없다.

### 최초 1회 설정

```bash
# 1. 배포 전용 키 생성
ssh-keygen -t ed25519 -f ~/.ssh/mocou-deploy -N ""

# 2. 공개키를 EC2의 authorized_keys에 등록 (SSM 권한 있는 사람이 실행)
aws ssm send-command \
  --instance-ids <app-ec2 인스턴스ID> \
  --document-name "AWS-RunShellScript" \
  --parameters commands="mkdir -p /home/ubuntu/.ssh && echo '$(cat ~/.ssh/mocou-deploy.pub)' \
    >> /home/ubuntu/.ssh/authorized_keys && chmod 700 /home/ubuntu/.ssh \
    && chmod 600 /home/ubuntu/.ssh/authorized_keys && chown -R ubuntu:ubuntu /home/ubuntu/.ssh"

# 3. SSM 세션을 SSH 프록시로 쓰는 플러그인 설치
brew install --cask session-manager-plugin
```

`~/.ssh/config`에 추가:

```
Host mocou-app
  HostName <app-ec2 인스턴스ID>
  User ubuntu
  IdentityFile ~/.ssh/mocou-deploy
  ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"
```

### 이후에는

```bash
npm run deploy
```

`scripts/deploy.sh`가 하는 일:
1. `npm run build` — `dist/` 생성
2. `ssh mocou-app`으로 `/var/www/mocou/dist` 디렉터리 준비 (최초 1회만 실질적인 변화)
3. `rsync -e ssh --delete`로 `dist/`를 그 경로에 동기화 — `scp -r`이 아니라 rsync를 쓰는
   이유는, vite 빌드 산출물 파일명에 콘텐츠 해시가 붙어(`index-AbC123.js`) 빌드마다 이름이
   바뀌기 때문이다. `scp -r`은 새 파일만 얹고 이전 빌드의 죽은 파일을 그대로 둬서 EC2에
   안 쓰는 JS/CSS가 계속 쌓이지만, `--delete`는 로컬에 없는 원격 파일을 지워 항상 "지금
   빌드"와 같은 상태로 맞춘다.

nginx는 파일을 디스크에서 직접 읽으므로 배포 후 별도 reload가 필요 없다.
