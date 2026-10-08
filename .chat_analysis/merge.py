#!/usr/bin/env python3
"""合并分页消息，去重、排序，输出 JSONL 与统计。"""
import json
import glob
import os
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
msgs = {}
bad = 0

for f in sorted(glob.glob(os.path.join(BASE, 'pages', 'p*.json'))):
    try:
        with open(f) as fh:
            d = json.load(fh)
    except Exception:
        bad += 1
        continue
    if not d.get('ok'):
        bad += 1
        continue
    for m in d.get('data', {}).get('messages', []):
        mid = m.get('message_id')
        if mid:
            msgs[mid] = m

print(f'Total unique messages: {len(msgs)}  (bad files: {bad})')

def keyf(m):
    try:
        return (0, int(m.get('message_position')))
    except (TypeError, ValueError):
        return (1, 0)

all_msgs = sorted(msgs.values(), key=keyf)
for m in all_msgs:
    m.pop('message_app_link', None)
    m.pop('sender', None) if not m.get('sender') else None

with open(os.path.join(BASE, 'all_messages.jsonl'), 'w') as fh:
    for m in all_msgs:
        fh.write(json.dumps(m, ensure_ascii=False) + '\n')

types = Counter(m.get('msg_type') for m in all_msgs)
print('By type:', dict(types))
senders = Counter((m.get('sender') or {}).get('name') or (m.get('sender') or {}).get('id') for m in all_msgs)
print('Top senders:', senders.most_common(20))
if all_msgs:
    print('Time span:', all_msgs[0].get('create_time'), '->', all_msgs[-1].get('create_time'))
print('Deleted:', sum(1 for m in all_msgs if m.get('deleted')))