#!/usr/bin/env python3
"""将手册各章节中的 [时间] 标注从 UTC 换算为北京时间（+8h）。"""
import re
import os
from datetime import datetime, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.join(BASE, 'sections')

PAT = re.compile(r'\[(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?:-(\d{2}):(\d{2}))?\]')


def shift(m):
    y, mo, d, h, mi = (int(m.group(i)) for i in range(1, 6))
    dt = datetime(y, mo, d, h, mi) + timedelta(hours=8)
    out = f'[{dt:%Y-%m-%d %H:%M}'
    if m.group(6):
        dt2 = datetime(y, mo, d, int(m.group(6)), int(m.group(7))) + timedelta(hours=8)
        out += f'-{dt2:%H:%M}'
    return out + ']'


total = 0
for fn in sorted(os.listdir(SEC)):
    if not fn.endswith('.md'):
        continue
    p = os.path.join(SEC, fn)
    t = open(p).read()
    t2, n = PAT.subn(shift, t)
    open(p, 'w').write(t2)
    total += n
    print(f'{fn}: {n} timestamps converted')

print('total converted:', total)