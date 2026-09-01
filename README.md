# MOCOU - Frontend

대규모 트래픽 환경에서 초과 발급 0건 · 1인 1매 · 정합성을 보장하는 선착순 쿠폰 발급 시스템의
프론트엔드.

<details>
<summary>기술 스택</summary>

| 구분 | 선택 |
|---|---|
| 언어/빌드 | TypeScript, Vite |
| 프레임워크 | React 19 |
| 라우팅 | React Router |
| 서버 상태 | TanStack Query (폴링) |
| 스타일 | Tailwind CSS v4 + shadcn 스타일 UI 프리미티브(직접 구현) |
| HTTP | Axios |
| 토스트 | sonner |
</details>
<details>
<summary>배포 서버 구성</summary>

프론트와 백엔드는 **같은 EC2 한 대**(app-ec2)에 같이 올라가고, 그 안에서도 역할이 나뉜다.

```
브라우저
  │  (포트 80, HTTP만 — HTTPS/도메인 없음)
  ▼
┌─────────────────────── EC2 (app-ec2) ──────────────────────┐
│  NGINX :80                                                 │
│   ├─ location /      → 정적 파일 직접 서빙 (/var/www/mocou/dist)│
│   └─ location /api/  → instance-ip:8080 으로 리버스 프록시      │
│                              │                             │
│                              ▼                             │
│          Docker Compose ── Spring Boot :8080               │
│                         ── MySQL, Redis                    │
└────────────────────────────────────────────────────────────┘
```

- **프론트는 빌드된 정적 파일**(`dist/`)로 nginx가 디스크에서 직접 읽어 서빙한다. Node 서버가 따로 떠 있는 게 아니다.
- **`/api/`로 시작하는 요청만** nginx가 같은 서버 안의 Spring Boot 컨테이너(8080)로 넘긴다. 나머지는 SPA 라우팅을 위해 전부 `index.html`로 폴백한다(`try_files $uri $uri/ /index.html`).
- 프론트와 백엔드가 **같은 오리진**(같은 IP, 같은 80번 포트)으로 나가기 때문에 **CORS 설정이 필요 없다.**
- **인증이 없다.** 로그인도, 토큰 검사도 없다. 관리자 화면과 고객 화면은 그냥 헤더 버튼으로 오갈 뿐 접근 제어가 없고, 8080 포트 자체는 보안그룹에서 특정 IP로만 제한돼 있다(관리자 API가 인터넷에 그대로 노출되진 않지만, 애플리케이션 레벨 인증은 없다는 뜻).
- 도메인·HTTPS는 의도적으로 안 쓴다 — Elastic IP + HTTP로만 운영한다.
</details>
<details>
<summary>디렉토리 구조</summary>

```
src/
├── api/
│   ├── adminApi.ts             # 관리자 API. 경로는 백엔드 컨트롤러를 그대로 옮긴 것
│   └── customerApi.ts          # 고객 API. 
│
├── types/
│   └── domain.ts               # 백엔드 DTO(record)에 1:1로 맞춘 타입. LOAD_TEST_SCENARIOS(V1~V6) 포함
│
├── hooks/                      # TanStack Query 훅
│   ├── useCoupons.ts            # 쿠폰 목록 조회 / 생성 / 삭제
│   ├── useStock.ts              # 실시간 재고 폴링 (부하테스트 중 1초, 평소 5초)
│   ├── useIssues.ts             # [리스트] 탭 발급 이력 페이지네이션
│   ├── useIssueResultCounts.ts  # Redis 발급 결과 집계 + DB 적재 진행 폴링
│   ├── useNotificationCounts.ts # 발급 성공 알림 발송 현황 폴링
│   ├── useDlqFailures.ts        # DLQ 최종 실패 목록 조회 + 재시도
│   ├── useLifecycle.ts          # 만료 스케줄러 on/off 조회·변경
│   ├── useLoadTest.ts           # 부하테스트 실행/최근 실행 조회 (쿠폰별 runId 기억)
│   ├── useVerification.ts       # 정합성 검증 시작 + 완료까지 폴링 (쿠폰별 runId 기억)
│   └── useCustomerIssue.ts      # 고객 쿠폰 발급 mutation
│
├── lib/
│   ├── http.ts                  # axios + ApiResponse 봉투 해제 + ApiError 변환
│   ├── dateUtils.ts             # 타임존 없는 LocalDateTime을 KST로 읽어 포맷
│   ├── lastCoupon.ts            # 관리자가 마지막으로 본 couponId 기억 (목록 실패 시 폴백용)
│   ├── memberId.ts              # 고객 브라우저별 memberId를 하나 뽑아 localStorage에 고정
│   └── utils.ts                 # cn() (clsx + tailwind-merge)
│
├── components/
│   ├── ui/                      # shadcn 스타일 프리미티브 (button, card, table, tabs, dialog, meter ...)
│   ├── brand/
│   │   ├── LgUplusLogo.tsx       # LG U+ 워드마크 (텍스트+브랜드컬러로 대체)
│   │   └── CoffeeIllustration.tsx # 커피컵 SVG 일러스트 (대체)
│   └── layout/
│       ├── AppShell.tsx          # 관리자 헤더 + 핑크 톤 배경 + Outlet
│       └── CustomerShell.tsx     # 고객 헤더 + 로고·커피 히어로 배너 + Outlet
│
├── features/
│   ├── coupon/components/
│   │   ├── CouponGalleryView.tsx    # 관리자 대시보드 갤러리(카드) 뷰
│   │   ├── CouponListView.tsx       # 관리자 대시보드 리스트(테이블) 뷰
│   │   ├── CreateCouponDialog.tsx   # 쿠폰 추가 폼 (종료일시·이름은 선택)
│   │   ├── StockPanel.tsx           # 실시간 재고: 히어로 수치 + 미터 + KPI 타일 4개
│   │   ├── CouponStatusBadge.tsx    # SCHEDULED / OPEN / CLOSED
│   │   ├── AdminFeaturesPanel.tsx   # "관리자 기능" 토글로 접어둔 패널 (만료 스케줄러 + DLQ 관리)
│   │   ├── ExpirationSchedulerToggle.tsx # 만료 스케줄러 on/off 버튼
│   │   └── DlqFailurePanel.tsx      # DLQ 최종 실패 목록 + 재시도 (쿠폰 ID 직접 입력)
│   ├── loadtest/components/
│   │   ├── LoadTestTab.tsx          # [실행] 탭: 시나리오 6종(V1~V6) 중 택1, 시작, 결과
│   │   ├── IssueResultPanel.tsx     # Redis 발급 집계 + DB 적재 진행 (거절 사유 내역 포함)
│   │   ├── NotificationCountsPanel.tsx # 발급 성공 알림 발송 현황(전체/완료/대기/실패)
│   │   └── RunStatusBadge.tsx       # PENDING / RUNNING / SYNCING / SUCCESS / FAILED
│   ├── issues/components/
│   │   ├── IssueListTab.tsx         # [리스트] 탭: 발급 건 + 예약 순번/발급 시 잔여재고
│   │   └── IssueStatusBadge.tsx     # UNISSUED / ISSUED / USED / EXPIRED
│   └── consistency/components/
│       ├── ConsistencyTab.tsx       # [정합성] 탭: 검증 실행(단일 버튼) → 폴링 → 규칙별 결과
│       ├── RuleResultCard.tsx       # 규칙 1종 결과 + 위반 상세 드릴다운 (9종 규칙)
│       └── VerdictBadge.tsx         # PASS / FAIL / ERROR / 진행중
│
├── pages/
│   ├── DashboardPage.tsx           # "/" 관리자 쿠폰 목록 + "관리자 기능" 토글 + 쿠폰 추가
│   ├── CouponDetailPage.tsx        # "/coupons/:couponId" 재고 패널 + 회차 삭제 + 탭 3종
│   └── customer/
│       ├── CustomerDashboardPage.tsx # "/shop" 예정·진행중 쿠폰 카드 스택 (종료 회차는 숨김)
│       └── CustomerCouponPage.tsx    # "/shop/coupons/:couponId" 발급 화면, [쿠폰 받기] 버튼
│
├── App.tsx / main.tsx / index.css
```
</details>
<details>
<summary>라우팅</summary>

| 경로 | 레이아웃 | 화면 |
|---|---|---|
| `/` | `AppShell` | 관리자 대시보드 |
| `/coupons/:couponId` | `AppShell` | 관리자 쿠폰 상세 (실행/리스트/정합성) |
| `/shop` | `CustomerShell` | 고객 대시보드 (카드 스택) |
| `/shop/coupons/:couponId` | `CustomerShell` | 고객 발급 화면 |
| 그 외 | — | `/`로 리다이렉트 |
</details>
<details>
<summary>API 목록</summary>

| 화면 | Method + Path | 백엔드 |
|---|---|---|
| 대시보드 목록 (관리자·고객 공용) | `GET /api/admin/coupons` | `admin/AdminCouponController` |
| 쿠폰 추가 | `POST /api/admin/coupons` | `coupon/CouponRoundController` |
| **회차 삭제** | `DELETE /api/admin/coupons/{couponId}` | 〃 |
| 재고 조회 (관리자 패널·고객 발급 화면 공용) | `GET /api/admin/coupons/{couponId}/stock` | `admin/AdminCouponController` |
| [리스트] | `GET /api/admin/coupons/{couponId}/issues?page=&size=` | 〃 |
| [실행] 발급 결과 집계 | `GET /api/admin/coupons/{couponId}/issue-result-counts` | 〃 |
| **알림 처리 현황** | `GET /api/admin/coupons/{couponId}/notification-counts` | 〃 |
| **DLQ 최종 실패 목록** | `GET /api/admin/coupons/{couponId}/issue-dlq/failed` | 〃 |
| **DLQ 재시도** | `POST /api/admin/coupons/{couponId}/issue-dlq/failed/{recordId}/retry` | 〃 |
| [정합성] 시작 | `POST /api/admin/verifications?issueRunId=` | `consistency/VerificationController` |
| [정합성] 조회 | `GET /api/admin/verifications/{runId}` | 〃 |
| [실행] 시작 | `POST /api/admin/load-tests` `{couponId, scenario}` | `loadtest/LoadTestExecutionController` |
| [실행] 상태 조회 | `GET /api/admin/load-tests/{runId}` | 〃 |
| **만료 스케줄러 조회/변경** | `GET`/`PUT /api/internal/lifecycle/expiration-scheduler` | `lifecycle/ExpirationSchedulerControlController` |
| **고객 쿠폰 발급** | `POST /api/coupons/{couponId}/issues` `{memberId}` | `issue/CouponIssueReservationController` |

**화면에서 안 쓰는 API**(구현은 돼 있지만 UI 트리거가 없음):
- `POST /api/coupon-issues/{issueId}/use` — 쿠폰 사용 처리, 화면 없음
</details>

## 로컬에서 개발하기

```bash
npm install
npm run dev      # http://localhost:5173, /api 요청은 vite.config.ts가 localhost:8080으로 프록시
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

백엔드가 같이 떠 있어야 한다:
```bash
cd ../backend && ./gradlew bootRun   # MySQL/Redis는 docker compose로 먼저 띄워둘 것
```

`VITE_API_BASE_URL`을 `.env`에 지정하면 그 주소로 직접 요청한다. 비워두면 `/api`로 요청 → `vite.config.ts`의 proxy가 `localhost:8080`으로 넘긴다.

## 서버에 적용하기 (배포)

프론트는 CI가 없다 — GitHub Actions는 **백엔드**만 자동 배포하고(`backend/.github/workflows/cd.yml`, `main` push 시 이미지 빌드 → SSM Run Command로 EC2에서 `docker compose pull && up -d`), 프론트 빌드 산출물은 **손으로** EC2에 올린다.

평소 개발 중엔 배포할 필요가 없다 — `vite.config.ts`의 proxy target을 `localhost:8080`에서 app-ec2 주소로 바꾸면 로컬 dev 서버로 EC2 백엔드를 바로 붙여볼 수 있고, 저장할 때마다 HMR로 즉시 반영된다. `npm run deploy`는 **팀원에게 실제 배포된 화면을 보여줘야 할 때만** 손으로 돌린다.

app-ec2는 키 페어 없이 떠 있다 — 22번 포트를 열고 `.pem`으로 붙는 대신 **SSM 세션을 SSH 터널로 쓴다.**

### 최초 1회 설정 (SSM 설정)
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
3. `rsync -e ssh --delete`로 `dist/`를 그 경로에 동기화 — vite 빌드 산출물은 파일명에 콘텐츠
   해시가 붙어(`index-AbC123.js`) 빌드마다 이름이 바뀐다. `scp -r`은 새 파일만 얹고 예전 빌드의
   죽은 파일을 그대로 둬서 EC2에 안 쓰는 JS/CSS가 계속 쌓이지만, `rsync --delete`는 로컬에
   없는 원격 파일을 지워 항상 "지금 빌드"와 같은 상태로 맞춘다.

nginx는 파일을 디스크에서 직접 읽으므로 배포 후 별도 reload가 필요 없다.

### DB 직접 접속(DataGrip 등)

MySQL은 `127.0.0.1:3306`에만 바인딩돼 있어 EC2 밖에서 직접 못 붙는다. SSM 터널을 열어야 한다:

```bash
ssh -f -N -L 13306:127.0.0.1:3306 mocou-app
```

EC2를 껐다 켜면 이 터널도 같이 죽으니, 재기동 후 다시 실행해야 한다.
