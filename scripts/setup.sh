#!/usr/bin/env bash
# One-time activation of a Relay deployment on Firebase.
# Prereqs (one console visit, ~1 minute):
#   1. Firestore : https://console.firebase.google.com/project/relay-helpdesk/firestore
#      → "Create database" → Standard edition, production mode, any US location
#   2. Auth      : https://console.firebase.google.com/project/relay-helpdesk/authentication
#      → "Get started" → Email/Password → Enable → Save
# Then run:  bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./.firebaserc','utf8')).projects.default)")
echo "▸ Firebase project: $PROJECT"

echo "▸ Checking for a registered web app…"
APP_ID=$(firebase apps:list --project "$PROJECT" --json 2>/dev/null \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const w=(j.result||[]).find(a=>a.platform==='WEB');console.log(w?w.appId:'')})")

if [ -z "$APP_ID" ]; then
  echo "▸ Registering web app 'Relay Web'…"
  firebase apps:create web "Relay Web" --project "$PROJECT" >/dev/null
  APP_ID=$(firebase apps:list --project "$PROJECT" --json \
    | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const w=(j.result||[]).find(a=>a.platform==='WEB');console.log(w?w.appId:'')})")
fi
echo "▸ Web app: $APP_ID"

echo "▸ Writing src/firebase-config.json…"
firebase apps:sdkconfig web "$APP_ID" --project "$PROJECT" --json \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const c=j.result.sdkConfig||j.result;require('fs').writeFileSync('src/firebase-config.json',JSON.stringify({projectId:c.projectId,appId:c.appId,apiKey:c.apiKey,authDomain:c.authDomain,storageBucket:c.storageBucket||'',messagingSenderId:c.messagingSenderId||''},null,2)+'\n')})"

echo "▸ Picking the hosting site…"
SITE=$(firebase hosting:sites:list --project "$PROJECT" --json \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const sites=(j.result&&j.result.sites)||[];const ids=sites.map(x=>x.name.split('/').pop());console.log(ids.includes('relay-helpdesk')?'relay-helpdesk':(ids[0]||''))})")
if [ -n "$SITE" ]; then
  node -e "const fs=require('fs');const f='./firebase.json';const j=JSON.parse(fs.readFileSync(f,'utf8'));j.hosting.site='$SITE';fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n')"
  echo "▸ Hosting site: $SITE"
fi

echo "▸ Building…"
npm run build

echo "▸ Deploying Firestore rules + hosting…"
firebase deploy --only firestore,hosting --project "$PROJECT"

echo
echo "✅ Done. Relay is live at: https://$SITE.web.app"
echo "   If sign-up says accounts are disabled, enable Email/Password auth (link at the top of this script)."
