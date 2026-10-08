#!/usr/bin/env python3
"""从全量消息中筛出高信息量候选，并输出带上下文的语料分片。"""
import json
import os
import re
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
msgs = [json.loads(l) for l in open(os.path.join(BASE, 'all_messages.jsonl'))]

TECH_KW = [
    'TRAE', 'trae', 'SOLO', 'solo', 'MCP', 'mcp', 'API', 'api', 'SDK', 'sdk',
    '提示词', 'prompt', 'Prompt', 'token', 'Token', '模型', '上下文', '幻觉',
    'Agent', 'agent', '工作流', '插件', 'MCP服务', '部署', '服务器', '接口',
    '代码', '报错', 'bug', 'Bug', '调试', '重构', '函数', '变量', '数据库',
    '前端', '后端', 'Python', 'python', 'Java', 'java', 'JavaScript', 'TS',
    'React', 'Vue', 'node', 'Node', 'npm', 'git', 'Git', 'GitHub', 'github',
    'Docker', 'docker', 'SQL', 'sql', 'linux', 'Linux', 'nginx', 'docker',
    'Figma', 'figma', 'Cursor', 'cursor', 'Claude', 'claude', 'GPT', 'Gemini',
    'DeepSeek', 'deepseek', '豆包', '即梦', '扣子', 'Coze', 'coze', 'n8n',
    '数据库', '游戏引擎', 'Unity', 'unity', 'Cocos', 'Godot', 'canvas', 'WebGL',
    'Three.js', 'three.js', '微信', '小程序', 'H5', 'h5', 'App', 'app',
    '算法', '数据结构', '性能', '优化', '安全', '加密', '爬虫', '自动化',
    '本地', '知识库', 'RAG', 'rag', '向量', 'embedding', '微调', '训练',
    'prompts', '系统提示', '规则', 'skills', 'Skills', 'skill', 'agent.md',
    '上下文工程', '工程化', '架构', '测试', '灰度', '监控', '日志', '文档',
    '设计稿', 'UI', 'UI设计', '素材', '图片', '视频', '音效', '美术',
    '变现', '商业模式', '运营', '推广', '获客', '留存', '用户',
]

URL_RE = re.compile(r'https?://[^\s\)\]，。、）】"\']+')


def norm(m):
    c = m.get('content') or ''
    if not isinstance(c, str):
        c = str(c)
    return c


def score(m):
    c = norm(m)
    s = 0
    urls = URL_RE.findall(c)
    if urls:
        s += 2
    if '```' in c or '<code' in c or re.search(r'\bdef \w+\(|\bclass \w+|\bimport \w+|<\w+>.*</\w+>', c):
        s += 3
    hits = sum(1 for k in TECH_KW if k in c)
    s += min(hits, 6)
    if len(c) > 100:
        s += 1
    if len(c) > 300:
        s += 1
    if len(c) > 800:
        s += 1
    if m.get('msg_type') in ('post', 'merge_forward'):
        s += 1
    if c.startswith('[Image') or c.startswith('[Sticker]') or c.strip() == '':
        s -= 3
    return s


for m in msgs:
    m['_txt'] = norm(m)
    m['_score'] = score(m)

scores = Counter(m['_score'] for m in msgs)
print('score distribution:', sorted(scores.items()))

cand_idx = [i for i, m in enumerate(msgs) if m['_score'] >= 3 and not m.get('deleted')]
print('candidates:', len(cand_idx), 'of', len(msgs))

# 输出候选明细
with open(os.path.join(BASE, 'candidates.jsonl'), 'w') as fh:
    for i in cand_idx:
        m = msgs[i]
        fh.write(json.dumps({
            't': m['create_time'], 's': (m.get('sender') or {}).get('name'),
            'ty': m['msg_type'], 'x': m['_txt'], 'sc': m['_score'], 'i': i,
        }, ensure_ascii=False) + '\n')

# 文本总量估算
total_chars = sum(len(m['_txt']) for m in msgs)
cand_chars = sum(len(msgs[i]['_txt']) for i in cand_idx)
print(f'total chars: {total_chars}, candidate chars: {cand_chars}, file size KB: {os.path.getsize(os.path.join(BASE,"all_messages.jsonl"))//1024}')