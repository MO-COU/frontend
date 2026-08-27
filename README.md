# MOCOU - Frontend

대규모 트래픽 환경에서 초과 발급 0건 · 1인 1매 · 정합성을 보장하는 선착순 쿠폰 발급 시스템의
**관리자 대시보드**. 로그인 없이 쿠폰별 [실행] · [리스트] · [정합성] 화면으로 구성된다.

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
│   └── adminApi.ts            # 관리자 API 진입점. 경로는 백엔드 컨트롤러를 그대로 옮긴 것
│
├── types/
│   └── domain.ts              # 백엔드 DTO(record)에 1:1로 맞춘 타입
│
├── hooks/                     # TanStack Query 훅 (adminApi만 호출)
│   ├── useCoupons.ts           # 쿠폰 목록 조회 / 생성
│   ├── useStock.ts             # 실시간 재고 폴링 (부하테스트 중 1초, 평소 5초)
│   ├── useIssues.ts            # 발급 리스트 페이지네이션
│   ├── useIssueResultCounts.ts # Redis 발급 결과 집계 + DB 적재 진행 폴링
│   ├── useLoadTest.ts          # 부하테스트 실행/최근 실행 조회/초기화
│   └── useVerification.ts      # 정합성 검증 시작 + 완료까지 2초 폴링
│
├── lib/
│   ├── http.ts                 # axios + ApiResponse 봉투 해제 + ApiError 변환
│   ├── dateUtils.ts            # 타임존 없는 LocalDateTime을 KST로 읽어 포맷
│   ├── lastCoupon.ts           # 마지막으로 본 couponId 기억
│   └── utils.ts                # cn() (clsx + tailwind-merge)
│
├── components/
│   ├── ui/                     # shadcn 스타일 프리미티브 (button, card, table, tabs, dialog, meter ...)
│   └── layout/AppShell.tsx     # 상단 헤더 + 라우터 Outlet
│
├── features/
│   ├── coupon/components/
│   │   ├── CouponGalleryView.tsx    # 대시보드 갤러리(카드) 뷰
│   │   ├── CouponListView.tsx       # 대시보드 리스트(테이블) 뷰
│   │   ├── CreateCouponDialog.tsx   # 쿠폰 추가 폼 (회차·종료일시는 선택)
│   │   ├── StockPanel.tsx           # 실시간 재고: 히어로 수치 + 미터 + KPI 타일 4개
│   │   └── CouponStatusBadge.tsx    # SCHEDULED / OPEN / CLOSED
│   ├── loadtest/components/
│   │   ├── LoadTestTab.tsx          # [실행] 탭: 시나리오·VU·ramp-up 입력 → 시작, 초기화, 실행 결과
│   │   ├── IssueResultPanel.tsx     # Redis 발급 집계 + DB 적재 진행 (거절 사유 내역 포함)
│   │   └── RunStatusBadge.tsx
│   ├── issues/components/
│   │   ├── IssueListTab.tsx         # [리스트] 탭: 발급 건(회원정보는 서버에서 마스킹되어 옴)
│   │   └── IssueStatusBadge.tsx     # UNISSUED / ISSUED / USED / EXPIRED
│   └── consistency/components/
│       ├── ConsistencyTab.tsx       # [정합성] 탭: 검증 시작 → 폴링 → 규칙별 결과
│       ├── RuleResultCard.tsx       # 규칙 1종 결과 + 위반 상세 드릴다운
│       └── VerdictBadge.tsx         # PASS / FAIL / ERROR / 진행중
│
├── pages/
│   ├── DashboardPage.tsx       # "/" 쿠폰 목록 (갤러리 ↔ 리스트 토글, 쿠폰 추가, 목록 실패 시 ID 폴백)
│   └── CouponDetailPage.tsx    # "/coupons/:couponId" 재고 패널 + 3개 탭
│
├── App.tsx / main.tsx / index.css
```

## 연동한 백엔드 API

| 화면 | Method + Path | 백엔드 |
|---|---|---|
| 대시보드 목록 | `GET /api/admin/coupons` | `admin/AdminCouponController` |
| 쿠폰 추가 | `POST /api/admin/coupons` | `coupon/CouponRoundController` |
| 재고 패널 | `GET /api/admin/coupons/{couponId}/stock` | `admin/AdminCouponController` |
| [리스트] | `GET /api/admin/coupons/{couponId}/issues?page=&size=` | 〃 |
| [실행] 발급 결과 | `GET /api/admin/coupons/{couponId}/issue-result-counts` | 〃 (PR #126·#135) |
| [정합성] 시작 | `POST /api/admin/verifications?issueRunId=` | `consistency/VerificationController` |
| [정합성] 조회 | `GET /api/admin/verifications/{runId}` | 〃 |
| [실행] 초기화 | `POST /api/admin/load-test/reset?couponId=` | `loadtest/LoadTestResetController` |
| [실행] 시작 | `POST /api/admin/coupons/{couponId}/load-test` | ⚠️ **백엔드 미구현** |
| [실행] 최근 실행 | `GET /api/admin/coupons/{couponId}/load-test/latest` | ⚠️ **백엔드 미구현** |

사용자용 API(`POST /api/coupons/{couponId}/issues`, `POST /api/coupon-issues/{issueId}/use`)는
관리자 화면에서 쓰지 않아 연동하지 않았다.

## 알아둘 것

- **모든 응답은 `ApiResponse` 봉투**(`{success, data, error, traceId, timestamp}`)로 온다.
  `lib/http.ts` 인터셉터가 한 번만 벗겨내므로, API 함수와 화면은 알맹이만 다룬다.
  에러는 백엔드 `ErrorCode`를 담은 `ApiError`로 바뀌어 던져진다.
- **쿠폰 생성 요청은 `{ totalQuantity, openAt, closeAt?, name? }`다.** `closeAt`을 비우면 오픈 당일
  23:59:59, `name`을 비우면 `"아메리카노 무료 쿠폰 {N}회차"`로 서버가 채운다. 응답이 왔다는 것은
  Redis 초기화까지 끝났다는 뜻이라 바로 발급이 가능하다.
- **생성되는 회차의 상태는 항상 `OPEN`이다.** 오픈 전 발급 차단은 Redis Lua가 하므로 `SCHEDULED`가
  없어도 효과가 같고, 전환 주체가 없으면 동기화 컨슈머가 멈춘다. `SCHEDULED`는 시더가 만든 과거
  데이터에만 남아 있다.
- **초기화는 `couponId`를 보낸다.** 종료된 회차를 지목하면 `LOAD_TEST_TARGET_CLOSED`(409)로 거부되어,
  검증 대상인 과거 발급 데이터가 실수로 사라지지 않는다.
- 목록 조회가 실패하면 에러 문구와 함께 "ID로 바로 열기" 폴백을 보여준다.
- **발급 결과는 Redis 누적 집계다.** `reserved`(Lua가 수락) / `failed`(거절 6종) / `dbPersisted`(실제
  coupon_issue 행) / `pendingOrRetrying`(아직 DB 미반영) / `compensated`(예약 원복)를 나눠 보여준다.
  거절은 시스템이 제대로 막은 결과라 붉게 칠하지 않는다 — 재고 소진은 초과 발급을, 중복 발급은
  1인 1매를 막았다는 증거다.
- **local 프로필은 동기화 컨슈머가 꺼져 있다**(`mocou.issue.sync.enabled`는 prod에서만 true).
  그래서 로컬에서는 `dbPersisted`가 0에 머물고 `pendingOrRetrying`이 줄지 않는다. 버그가 아니다.
- **재고는 세 가지 수치를 구분해서 보여준다** — `issuedQuantity`(실시간 Redis),
  `dbIssuedQuantity`(실제 DB 적재), `syncGapQuantity`(아직 반영 안 된 차이).
  동기화 지연이 남아 있으면 초기화가 `LOAD_TEST_SYNC_IN_PROGRESS`로 거부된다.
- **정합성 검증은 비동기다.** `POST`는 `runId`만 주고 202로 끝나며, 완료까지 1~2분 걸린다.
  화면은 `runId`를 localStorage에 남겨두고 2초마다 폴링한다. 탭이 숨어도 폴링이 멈추지 않도록
  `refetchIntervalInBackground: true`를 켜뒀다 — 끄면 다른 탭을 보고 온 사이 "검증 중"에 멈춘다.
- **초기화는 검증 이력까지 지운다.** 그래서 들고 있던 `runId`가 죽을 수 있는데,
  `VERIFICATION_RUN_NOT_FOUND`가 오면 에러를 띄우는 대신 조용히 버린다.
- **재실행 차단은 "실행 중일 때만"이다.** DB의 `UNIQUE(coupon_id)` 제약은 V6에서 제거됐다
  (동일 조건 반복 실행이 증명 대상이라서). 프론트도 `RUNNING` 동안만 버튼을 막는다.

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
