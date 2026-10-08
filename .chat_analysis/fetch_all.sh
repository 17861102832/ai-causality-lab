#!/bin/bash
# 全量抓取 TRAE 交流群消息，分页保存为 JSON 文件
set -e
cd /workspace/.chat_analysis

CHAT_ID="oc_bb9de104afaa52da14a5cc2ea6d4f821"
PAGE_TOKEN=""
PAGE=1
MAX_PAGES=400

mkdir -p pages

while [ $PAGE -le $MAX_PAGES ]; do
  if [ -z "$PAGE_TOKEN" ]; then
    lark-cli im +chat-messages-list --chat-id "$CHAT_ID" --order asc --page-size 50 --no-reactions --format json > "pages/p$(printf '%03d' $PAGE).json" 2>"pages/p$(printf '%03d' $PAGE).err"
  else
    lark-cli im +chat-messages-list --chat-id "$CHAT_ID" --order asc --page-size 50 --page-token "$PAGE_TOKEN" --no-reactions --format json > "pages/p$(printf '%03d' $PAGE).json" 2>"pages/p$(printf '%03d' $PAGE).err"
  fi

  RESULT=$(python3 -c "
import json
with open('pages/p$(printf '%03d' $PAGE).json') as f:
    d = json.load(f)
if not d.get('ok'):
    print('ERROR')
else:
    data = d['data']
    print(data.get('page_token') or '', '|', data.get('has_more'))
" 2>/dev/null || echo "PARSE_ERROR")

  if [ "$RESULT" = "ERROR" ] || [ "$RESULT" = "PARSE_ERROR" ]; then
    echo "Page $PAGE failed, stopping."
    exit 1
  fi

  PAGE_TOKEN=$(echo "$RESULT" | cut -d'|' -f1 | xargs)
  HAS_MORE=$(echo "$RESULT" | cut -d'|' -f2 | xargs)

  echo "Page $PAGE done, has_more=$HAS_MORE"
  if [ "$HAS_MORE" != "True" ] && [ "$HAS_MORE" != "true" ]; then
    echo "Fetch complete at page $PAGE"
    break
  fi
  PAGE=$((PAGE+1))
done
echo "ALL DONE"