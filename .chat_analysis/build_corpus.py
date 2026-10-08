#!/usr/bin/env python3
"""构建供分析使用的全量语料（轻度过噪声过滤）并切分为分片文件。"""
import json
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
msgs = [json.loads(l) for l in open(os.path.join(BASE, 'all_messages.jsonl'))]

DROP_TYPES = {'sticker', 'system', 'nonsupport', 'share_calendar_event', 'video_chat'}
PURE_NOISE = re.compile(r'^[\s\u200b·。，、！？~～.…!?\-—+*=^_\|\\/\[\]【】()（）:：;；"\'“”‘’]+$')
EMOJI_ONLY = re.compile(r'^([\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F\u200d\s\[\]a-zA-Z0-9]{0,12})$')

lines = []
kept = 0
for m in msgs:
    if m.get('deleted'):
        continue
    t = m.get('msg_type')
    if t in DROP_TYPES:
        continue
    txt = (m.get('content') or '').strip()
    if not txt:
        continue
    if t == 'image':
        continue
    # 去除服务端渲染的图片占位，仅保留有文字的
    stripped = re.sub(r'!\[Image\]\(img_[^\)]+\)', '', txt)
    stripped = re.sub(r'\[Image: img_[^\]]+\]', '', stripped).strip()
    if not stripped:
        continue
    if PURE_NOISE.match(stripped) and len(stripped) < 20:
        continue
    if len(stripped) <= 3:
        continue
    name = (m.get('sender') or {}).get('name') or '未知'
    ts = (m.get('create_time') or '')[:16]
    lines.append(f'[{ts}] {name}: {stripped}')
    kept += 1

corpus = '\n'.join(lines)
print(f'kept {kept} messages, {len(corpus)} chars')

outdir = os.path.join(BASE, 'corpus')
os.makedirs(outdir, exist_ok=True)
for f in os.listdir(outdir):
    os.remove(os.path.join(outdir, f))

# 按 ~30000 字符切分，尽量在消息边界处切
CHUNK = 30000
chunks = []
cur = []
cur_len = 0
for ln in lines:
    if cur_len + len(ln) + 1 > CHUNK and cur:
        chunks.append('\n'.join(cur))
        cur, cur_len = [], 0
    cur.append(ln)
    cur_len += len(ln) + 1
if cur:
    chunks.append('\n'.join(cur))

for i, c in enumerate(chunks, 1):
    with open(os.path.join(outdir, f'chunk_{i:02d}.txt'), 'w') as f:
        f.write(c)

print(f'wrote {len(chunks)} chunks of ~{CHUNK} chars')
print('first date:', lines[0][:20] if lines else None, 'last date:', lines[-1][:20] if lines else None)