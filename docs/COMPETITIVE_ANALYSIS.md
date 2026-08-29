# 竞品解析 · 防止重复造轮子

> 目标：在动手前，先把 GitHub 上"平行世界 / what-if / 多智能体推演"赛道跑一遍，确认 **AI 因果律** 的差异化定位，避免和现有项目撞车。
> 调研日期：2026-08-29 ｜ 结论：本赛道已有 11+ 开源项目，但**个人情感向 + 可分享配图 + 轻量即玩** 这一格是空的。

---

## 一、赛道总览：三股势力

| 流派 | 代表项目 | 共性 | 痛点 |
|---|---|---|---|
| **重型多智能体推演**（企业/科研） | MiroFish、OASIS、Generative Agents | 百万级 Agent、GraphRAG、仿真引擎 | 部署重（Python+Node+Docker）、贵（$5/次）、非消费级 |
| **历史/世界线 what-if** | Alt-History-Agent、what-if-generator、reality-weaver、AltiVerse | 改写历史/世界事件，出时间线 | 聚焦"宏观历史"，不关"个人遗憾"的事 |
| **AI 叙事/文字冒险** | AI Dungeon、What-if(anime) | 开放式故事生成 | 纯文本、偏虚构、无"真实遗憾"锚点、无配图 |

**空白格**：「输入你真实的后悔 → 生成一条属于你的平行人生 + 一张 MiniMax 配图 → 一键分享」。没人占。

---

## 二、逐个解析（11 个）

### 1. MiroFish — 666ghj/MiroFish ⭐~34k
- **定位**：群体智能预测引擎，"预测万物"。上传报告/新闻 → 构建百万级 Agent 平行世界 → 推演未来。
- **技术**：React 前端 + Node 后端 + OASIS(CAMEL-AI) 多智能体 + GraphRAG + Zep 记忆。5 步流水线：图谱→环境→模拟→报告→深度交互。
- **代价**：AGPL-3.0（强 Copyleft）、需 Python 3.11-3.12 + Node 18+、常规模拟 **$5/次**、非个人向。
- **我们的差别**：它是"企业决策沙盘"，我们是"个人情感平行人生"。**不碰它的多智能体重型架构**，只借鉴它的 demo 交互骨架（现实种子→变量注入→报告）。

### 2. a16z-infra/ai-town — MIT ⭐~17k
- **定位**：虚拟小镇，AI 角色生活/聊天/社交。受 Generative Agents 启发。
- **技术**：Convex 后端 + PixiJS 游戏前端 + Ollama/OpenAI。像素风、可部署。
- **差别**：游戏化 NPC 模拟，无"因果律/遗憾"叙事，无配图分享。

### 3. Generative Agents (Smallville) — Stanford（Park et al. 2023）
- **定位**：开创性研究，25 个 Agent 在沙盒小镇自发办派对。记忆流-反思-计划三段式架构。
- **差别**：论文/科研代码，非产品，不可直接玩。是赛道"祖师爷"，我们借其"记忆-反思"思想做轻量版。

### 4. reality-weaver — ManakRaj-7 / MIT ⭐
- **定位**：**最像我们的竞品**。Parallel Reality Generator，"What if?" 生成平行时间线 + 头条新闻 + 后果分析。
- **技术**：React 18 + Vite + Tailwind + shadcn/ui + Framer Motion + Supabase（Lovable 生成）。有 Guest 模式、社区画廊、分享链接、Fork 时间线。
- **差别**：它偏"世界/历史线"（cosmic UI、粒子特效），**无个人遗憾锚点、无 AI 配图、无因果链推演**。我们补这三样 + MiniMax 出图。

### 5. what-if-generator — Nuraj250 / MIT
- **定位**：新闻/历史事件 → 替代历史时间线，D3.js 交互图谱。
- **技术**：React + Bootstrap + D3.js + Node/Express + GPT-4。可导出 PNG。
- **差别**：纯历史向、工程味重、无情感/个人/配图。

### 6. Alt-History-Agent — GaryRogers / MIT
- **定位**：LangGraph 多 Agent 生成替代历史（分歧点→时间线→章节叙事）。
- **技术**：Python FastAPI + LangGraph + React + Docker。
- **差别**：历史学术论文风，部署重，无个人/配图/裂变。

### 7. AltiVerse — LeoTheAIDev / MIT
- **定位**：把一个决策 fork 成 2-4 个现实，确定性引擎驱动"活人世界"。
- **技术**：Vite + React + TS + Mulberry32 确定性仿真 + 任意 OpenAI 兼容模型。local-first、离线、npx 一行跑。
- **差别**：偏"决策二阶效应教学/系统思维"，无个人遗憾情感锚、无配图分享。

### 8. What-if (anime) — byteakp
- **定位**：二次元"废话文学"风 what-if 讲述，毒舌 AI 人设。
- **技术**：React + Vite + Node/Express + Groq + Codestral + 向量库。Zen 极简 UI。
- **差别**：纯虚构 anime 叙事，无真实事件锚点、无配图（设计上说"OST 待加"）。

### 9. AI Dungeon — latitudegames
- **定位**：开放式文字冒险鼻祖（GPT-2 起家），玩家用指令控制剧情。
- **技术**：故事卡片锁定设定 + 记忆库 + 撤销/重试。2023 起集成 AI 出图（"See"指令）。
- **差别**：奇幻/科幻 sandbox，非"真实遗憾→平行人生"，且其出图为后期附加。我们反其道：出图是核心分享件。

### 10. CAMEL-AI / OASIS — camel-ai/oasis / MIT
- **定位**：百万级 Agent 社交媒体仿真平台（Twitter/Reddit），MiroFish 的引擎底座。
- **差别**：纯科研/平台，非产品。我们**不重造这个轮子**，只做它完全不覆盖的消费级情感应用。

### 11. 相关多智能体框架（提及，非直接竞品）
- **AgentVerse / ChatDev / MetaGPT / Voyager / AgentSims**：任务协作/软件公司/具身智能等框架。均偏"干活"，与"平行人生情感叙事"无重叠。

---

## 三、我们的差异化定位（守住空白格）

| 维度 | 现有项目 | **AI 因果律** |
|---|---|---|
| 锚点 | 历史/世界/虚构 | **你的真实遗憾**（"昨天没买那只股""三年前没表白"） |
| 视角 | 宏观推演 | **个人情感 + 因果链**（一个选择如何改写时间线） |
| 配图 | 多数无 / 游戏像素 | **MiniMax image-01 生成"平行世界"视觉**，分享核心 |
| 体感 | 重部署/贵 | **单页即玩**，无需 Python/Node 全家桶 |
| 传播 | 社区画廊 | **"我的平行人生"分享卡**，社交裂变 |
| 定位 | 企业/科研/游戏 | **消费级情感玩具 + 内容裂变器** |

**一句话**：MiroFish 是给 CEO 用的"未来沙盘"，AI 因果律 是给每个普通人用的"后悔药 + 朋友圈爆款生成器"。

---

## 四、可借鉴（不重复）

1. **mirofish demo 交互骨架**：现实种子 → 平行变量 → 推演工作台 → 报告。我们平移为：原事件 → 如果当时… → 因果律推演 → 平行人生报告 + 配图。
2. **reality-weaver 的分享/画廊机制**：分享链接 + 社区画廊，我们做"分享卡 + 本地画廊"。
3. **Generative Agents 的"记忆-反思"思想**：轻量化进我们的因果链生成 prompt（不建多 Agent，单次 LLM 产出结构化因果链）。
4. **AltiVerse 的 local-first / 自带 key 模式**：我们支持 `.env` 后端代理 + 客户端自带 key 双模式。

> 结论：不重新发明多智能体引擎、不重新发明历史时间线图谱。我们做的是**它们都没覆盖的个人情感 + 配图裂变**这一格。
