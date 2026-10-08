#!/usr/bin/env python3
"""把 10 份提取稿按章节（一~七 + 附录）重组为按主题聚合的文件，便于分区撰写。"""
import os
import re
import glob

BASE = os.path.dirname(os.path.abspath(__file__))
EX = os.path.join(BASE, 'extracted')
OUT = os.path.join(BASE, 'by_section')
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

SEC_NAMES = {
    '1': '01_技术知识点',
    '2': '02_技巧与提示词',
    '3': '03_踩坑与解决方案',
    '4': '04_资源与链接',
    '5': '05_作品与实践案例',
    '6': '06_观点与金句',
    '7': '07_数据与事实',
    'A': '08_附录_原文规则与提示词',
}

buckets = {k: [] for k in SEC_NAMES}

for path in sorted(glob.glob(os.path.join(EX, '*.md'))):
    src = os.path.basename(path)
    text = open(path).read()
    # 按 "## " 一级节切分
    parts = re.split(r'\n(?=## )', text)
    for p in parts:
        if not p.strip():
            continue
        head = p.split('\n', 1)[0]
        sec = None
        m = re.match(r'##\s*[一二三四五六七1-7][、.．]?', head)
        if m:
            idx = '一二三四五六七'.index(head[m.start():m.end()].strip('# ')[0]) + 1
            sec = str(idx)
        elif re.match(r'##\s*(附录|Appendix)', head, re.I):
            sec = 'A'
        elif re.match(r'##\s*[八九十]', head):
            sec = 'A'
        if sec is None:
            # 文件开头说明等，归入 01
            sec = '1'
        buckets[sec].append(f'\n<!-- 来源: {src} -->\n' + p.strip() + '\n')

for k, name in SEC_NAMES.items():
    body = '\n'.join(buckets[k])
    with open(os.path.join(OUT, f'{name}.md'), 'w') as f:
        f.write(body)
    print(name, len(body), 'chars')