#!/usr/bin/env bash
# 프론트를 빌드해서 app-ec2에 올린다. 팀원에게 보여줄 때만 손으로 실행한다.
# 평소 개발은 npm run dev(vite.config.ts의 proxy target을 app-ec2로 바꿔서)로 하지,
# 이 스크립트를 매번 돌리지 않는다 — 그건 CI가 할 일이지 저장할 때마다 할 일이 아니다.
#
# 사전 준비(최초 1회, README "배포(수동)" 참고):
#   1. 배포용 SSH 키 생성, EC2에 등록
#   2. ~/.ssh/config 에 Host mocou-app 등록 (SSM 터널 사용, 22번 포트를 열지 않는다)
#   3. session-manager-plugin 설치 (brew install --cask session-manager-plugin)
set -euo pipefail

REMOTE_HOST="mocou-app"            # ~/.ssh/config의 Host 별칭
REMOTE_PATH="/var/www/mocou/dist"  # nginx가 정적 파일로 서빙하는 경로

echo "▶ [1/3] 빌드 (tsc -b && vite build)"
npm run build

echo "▶ [2/3] 원격 디렉터리 준비"
# 최초 1회만 실제로 뭔가 하고, 이후에는 이미 있으니 조용히 넘어간다.
ssh "$REMOTE_HOST" "sudo mkdir -p $REMOTE_PATH && sudo chown \$(whoami):\$(whoami) $REMOTE_PATH"

echo "▶ [3/3] 전송 (rsync, 이전 빌드의 해시 파일명 잔여물 삭제 포함)"
# scp -r 대신 rsync를 쓴다. vite 빌드 산출물은 파일명에 콘텐츠 해시가 붙어서
# (index-AbC123.js) 빌드할 때마다 이름이 바뀐다. scp -r은 새 파일만 얹고 예전
# index-XyZ789.js는 그대로 남겨 EC2에 죽은 파일이 계속 쌓인다. rsync --delete는
# 로컬 dist/에 없는 원격 파일을 지워서 항상 "지금 빌드"와 같은 상태로 맞춘다.
rsync -avz --delete -e ssh dist/ "$REMOTE_HOST:$REMOTE_PATH/"

echo "▶ 완료. nginx는 파일을 디스크에서 직접 읽으므로 reload 불필요."
