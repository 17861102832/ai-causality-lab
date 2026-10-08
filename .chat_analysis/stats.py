#!/usr/bin/env python3
"""统计群画像数据，输出 JSON 供导读与图表使用。"""
import json
import os
import re
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
msgs = [json.loads(l) for l in open(os.path.join(BASE, 'all_messages.jsonl'))]
live = [m for m in msgs if not m.get('deleted')]

def txt(m):
    return m.get('content') or ''

# 月份分布
month = Counter(m['create_time'][:7] for m in live)

# 发言排行
senders = Counter((m.get('sender') or {}).get('name') or '未知' for m in live)

# 活跃时段
hours = Counter(m['create_time'][11:13] for m in live)

# 主题关键词覆盖（消息数）
TOPICS = {
    'TRAE/SOLO 工具': ['TRAE', 'Trae', 'trae', 'SOLO', 'solo'],
    '游戏开发': ['游戏', '玩法', '关卡', '数值', '引擎', 'Godot', 'godot', 'Unity', 'unity', 'Cocos', 'cocos', '小游戏', '塔防', 'Roguelike', 'roguelike'],
    'AI 生图/美术': ['生图', '出图', '图片', '美术', '素材', '序列帧', 'comfyui', 'ComfyUI', '即梦', '豆包', 'seedream', 'Seedream', 'nanobanana', '海报'],
    'AI 视频': ['视频', 'sora', 'Sora', '即梦', '可灵', 'seedance', 'Seedance', '分镜'],
    '提示词/规则': ['提示词', '规则', 'prompt', 'Prompt', 'skill', 'Skill', '工作流'],
    'MCP/Agent': ['MCP', 'mcp', 'Agent', 'agent', '子Agent', 'harness', 'codex', 'Codex'],
    '模型选型': ['Claude', 'claude', 'GPT', 'gpt', 'Gemini', 'gemini', 'DeepSeek', 'deepseek', 'GLM', 'glm', 'Kimi', 'kimi', 'Qwen', 'qwen', 'Minimax', 'MiniMax'],
    '部署/上线': ['部署', '上线', 'Vercel', 'vercel', '服务器', '域名', '备案'],
    '合规/变现': ['软著', '版号', '变现', '广告', '上架', '发行', '分成', '买量'],
    '踩坑/事故': ['删库', '回滚', '报错', '崩了', '挂了', '没了', '丢失', '封号'],
}

topic_counts = {}
for name, kws in TOPICS.items():
    c = 0
    for m in live:
        t = txt(m)
        if any(k in t for k in kws):
            c += 1
    topic_counts[name] = c

# 链接
urls = []
for m in live:
    urls += re.findall(r'https?://[^\s\)\]，。、）】"\']+', txt(m))
uniq = set(urls)
domains = Counter(re.sub(r'^https?://([^/]+).*', r'\1', u).lower() for u in uniq)

imgs = sum(1 for m in live if m['msg_type'] == 'image' or 'img_v3' in txt(m))
files = sum(1 for m in live if m['msg_type'] in ('file', 'media'))

stats = {
    'total': len(msgs),
    'live': len(live),
    'deleted': len(msgs) - len(live),
    'start': live[0]['create_time'],
    'end': live[-1]['create_time'],
    'senders': len(senders),
    'top_senders': senders.most_common(12),
    'month': dict(sorted(month.items())),
    'hours': dict(sorted(hours.items())),
    'topics': topic_counts,
    'urls_total': len(urls),
    'urls_unique': len(uniq),
    'top_domains': domains.most_common(20),
    'images': imgs,
    'media_files': files,
}
with open(os.path.join(BASE, 'stats.json'), 'w') as f:
    json.dump(stats, f, ensure_ascii=False, indent=1)

print(json.dumps({k: v for k, v in stats.items() if k not in ('top_domains',)}, ensure_ascii=False, indent=1)[:2500])
print('TOP DOMAINS:', stats['top_domains'][:12])