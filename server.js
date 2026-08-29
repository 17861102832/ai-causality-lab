// AI 因果律 · 平行人生生成器 — 后端代理（多节点递归推理引擎）
// 职责：把前端请求转给 MiniMax（文本 MiniMax-M3 + 出图 image-01），
//       不把 API Key 暴露给浏览器，并做结构化解析与容错。
//
// 引擎结构（多节点预测 + 递归推理）：
//   ① 种子节点  —— 定位分叉点、拆出 N 个人生维度
//   ② 推演节点×W —— 各维度并行预测第一阶因果链（多节点预测）
//   ③ 递归深化×D —— 每个维度节点迭代深化（推理→再推理→再推理）
//   ④ 合成节点  —— 汇总各维度链，提炼统一结论 + 金句 + 出图提示
//   ⑤ 出图节点  —— MiniMax image-01 绘出平行世界
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "4mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.MINIMAX_API_KEY;
const GROUP_ID = process.env.MINIMAX_GROUP_ID || "";
const TEXT_MODEL = process.env.MINIMAX_TEXT_MODEL || "MiniMax-M3";
const CHAT_BASE = process.env.MINIMAX_CHAT_BASE || "https://api.minimax.io/v1";
const IMAGE_BASE = process.env.MINIMAX_IMAGE_BASE || "https://api.minimax.io/v1";

const hasKey = Boolean(API_KEY && API_KEY !== "your_minimax_api_key_here");

// 强度档位上限，避免一次性把额度打爆
const CAP = { widthMin: 2, widthMax: 6, depthMin: 1, depthMax: 4, widthDef: 4, depthDef: 2 };

// ---------- 工具：从模型输出里抠出 JSON ----------
function extractJSON(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------- 通用 LLM 调用（带超时） ----------
async function llm(systemPrompt, userPrompt, { maxTokens = 900, temperature = 0.9 } = {}) {
  const body = {
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };
  if (GROUP_ID) body.group_id = GROUP_ID;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 35000);
  let resp;
  try {
    resp = await fetch(`${CHAT_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const err = await resp.text();
    const ex = new Error(`MiniMax chat 失败 ${resp.status}: ${err.slice(0, 300)}`);
    ex.status = resp.status;
    throw ex;
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}

// ---------- 出图节点：MiniMax image-01 ----------
async function generateImage(prompt) {
  const body = { model: "image-01", prompt, aspect_ratio: "16:9", response_format: "url", n: 1 };
  if (GROUP_ID) body.group_id = GROUP_ID;

  const resp = await fetch(`${IMAGE_BASE}/image_generation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`MiniMax image 失败 ${resp.status}: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  const url = data?.data?.image_url?.[0] || data?.data?.image_urls?.[0];
  const b64 = data?.data?.b64_image?.[0] || data?.data?.b64_images?.[0];
  if (url) return { type: "url", value: url };
  if (b64) return { type: "b64", value: b64 };
  throw new Error("MiniMax image 未返回可用图片");
}

// ---------- 节点 Prompt ----------
function seedSys(width) {
  return `你是「因果律引擎·种子节点」。用户输入真实遗憾与一个不同的选择。
你的任务：精准定位那个分叉点，并拆解出 ${width} 个最值得推演的人生维度（覆盖事业/财富、情感/关系、自我成长、命运/偶然 等，挑最贴合用户情境的）。

输出严格 JSON（不要任何解释、不要代码围栏）：
{
  "branchingPoint": "分叉发生的具体时刻（1 句，有画面）",
  "worldSketch": "这条平行人生的核心前提（1 句，≤20字）",
  "dimensions": ["维度1名", "维度2名", "维度3名", "维度4名"]
}`;
}

const CAUSAL_SYS = `你是「因果律引擎·推演节点」，负责单一人生维度。基于分叉点与所属维度，推演该维度下由这个选择引发的连锁人生节点（第一阶因果：一个选择如何滚雪球）。

输出严格 JSON（不要解释、不要围栏）：
{
  "dimension": "维度名",
  "chain": ["第一环：…", "第二环：…", "第三环：…", "第四环：…"],
  "life": ["该维度平行人生场景1", "场景2", "场景3"]
}`;

const DEEPEN_SYS = `你是「因果律引擎·递归深化节点」。针对【单一维度】，你已有该维度第一阶因果链与人生场景。
请进一步推演更深一阶的后果——那些第一阶不会立刻显现、但几年后回头才看清楚的连锁反应（蝴蝶效应的深处），可以带一点跨维度的回响。
只输出这一维度新增的更深处内容，不要重复已有内容。

输出严格 JSON（不要解释、不要围栏）：
{
  "addedChain": ["更深一环：…", "更深一环：…", "更深一环：…"],
  "addedLife": ["更深场景1", "更深场景2"]
}`;

const SYNTH_SYS = `你是「因果律引擎·合成节点」。汇总多条维度人生链，提炼出一条统一的平行人生结论，给读者一个有力量的收束。

输出严格 JSON（不要解释、不要围栏）：
{
  "worldTitle": "平行人生短标题（≤14字，有力量）",
  "mergedChain": ["统一因果链第1环", "第2环", "第3环", "第4环", "第5环"],
  "ending": "最终落点（1-2句，有画面感）",
  "goldenLine": "一句金句（≤20字，情绪极致，供分享卡）",
  "imagePrompt": "用中文写一段 AI 绘画视觉描述（电影感、有氛围、≤60字，代表这条平行世界的画面）"
}`;

// ---------- 主引擎：多节点递归推演 ----------
async function runEngine(event, alternative, tone, width, depth) {
  // ① 种子节点
  const seedText = await llm(
    seedSys(width),
    `原事件（真实遗憾）：${event}\n如果当时：${alternative}\n语气倾向：${tone || "真实、克制、有温度"}`,
    { maxTokens: 500, temperature: 0.8 }
  );
  const seed = extractJSON(seedText) || {};
  let dims = Array.isArray(seed.dimensions) ? seed.dimensions.slice(0, width) : [];
  while (dims.length < Math.max(2, width)) dims.push(`维度${dims.length + 1}`);
  const branchingPoint = seed.branchingPoint || "那个没有被选中的瞬间。";
  const worldSketch = seed.worldSketch || "另一种可能的人生。";

  // ② 推演节点 ×W（并行预测第一阶）
  const causalTasks = dims.map((dim) =>
    llm(
      CAUSAL_SYS,
      `分叉点：${branchingPoint}\n维度：${dim}\n原事件：${event}\n如果当时：${alternative}`,
      { maxTokens: 900, temperature: 0.9 }
    ).then(extractJSON)
  );
  let branches = await Promise.all(causalTasks);
  branches = branches.map((b, i) => b || { dimension: dims[i], chain: [], life: [] });

  // ③ 递归深化 ×D（每个维度节点迭代深挖）
  for (let it = 0; it < depth; it++) {
    const deepenTasks = branches.map((b) =>
      llm(
        DEEPEN_SYS,
        `维度：${b.dimension}\n该维度已有链：\n${(b.chain || []).join(" / ")}\n已有场景：\n${(b.life || []).join(" / ")}\n请推演更深一阶的后果。`,
        { maxTokens: 600, temperature: 0.85 }
      ).then(extractJSON)
    );
    const deeps = await Promise.all(deepenTasks);
    deeps.forEach((d, i) => {
      if (!d) return;
      const b = branches[i];
      b.chain = b.chain || [];
      b.life = b.life || [];
      if (Array.isArray(d.addedChain)) b.chain.push(...d.addedChain);
      if (Array.isArray(d.addedLife)) b.life.push(...d.addedLife);
    });
  }

  // ④ 合成节点
  const synthCtx = branches
    .map((b) => `【${b.dimension}】\n链：${(b.chain || []).join(" / ")}\n场景：${(b.life || []).join(" / ")}`)
    .join("\n\n");
  const synthText = await llm(
    SYNTH_SYS,
    `分叉点：${branchingPoint}\n\n${synthCtx}`,
    { maxTokens: 900, temperature: 0.9 }
  );
  const synth = extractJSON(synthText) || {};

  // ⑤ 出图节点
  let image = null;
  try {
    image = await generateImage(synth.imagePrompt || synth.worldTitle || worldSketch);
  } catch (e) {
    console.warn("出图失败（叙事仍返回）：", e.message);
    image = null;
  }

  return {
    worldTitle: synth.worldTitle || worldSketch,
    branchingPoint,
    worldSketch,
    dimensions: branches.map((b) => ({
      dimension: b.dimension,
      chain: b.chain || [],
      life: b.life || [],
    })),
    mergedChain: synth.mergedChain || [],
    ending: synth.ending || "",
    goldenLine: synth.goldenLine || "",
    imagePrompt: synth.imagePrompt || "",
    image,
    nodes: {
      seed: 1,
      causal: width,
      deepen: width * depth,
      synthesis: 1,
      image: 1,
      total: 2 + width * (1 + depth) + 1,
    },
  };
}

// ---------- Demo 模式（无 Key / Key 失效时，仍展示多节点递归结构） ----------
function buildDemo(event, alternative, width = 4, depth = 2) {
  const dims = [
    {
      dimension: "事业 / 财富",
      chain: ["你多停留的三秒，让你错过了那班车，却撞见了后来的合伙人。", "半年后你们凑钱做了个小项目，失败两次后跑通。", "第三年，那个被你放弃的稳定岗，成了别人羡慕不来的自由。", "更深一环：你开始教别人「如何在不确定的事上下注」。", "更深一环：一笔意外之财让你还清了父母房贷。"],
      life: ["平行世界的你，在出租屋白板上写满了商业画布。", "第一次签合同手在抖，但字签得干脆。", "如今你手机里存着上千张合影，而不是一堆未发送的草稿。"],
    },
    {
      dimension: "情感 / 关系",
      chain: ["犹豫被打破，你回了头，关系没有在那一刻断掉。", "你们笨拙但真实地重新认识彼此。", "第一个冬天，两个人挤在厨房煮酒酿圆子。", "更深一环：多年后你们在朋友聚会上讲起那个路口，笑出眼泪。", "更深一环：孩子的名字，藏着那天的地名。"],
      life: ["平行世界的你，在那个路口转身，说了一句「等一下」。", "你们重新开始，像两棵被风吹斜又扶正的小树。", "如今你不再是一个人刷着旧照片失眠。"],
    },
    {
      dimension: "自我 / 心智",
      chain: ["你第一次发现，懦弱和勇敢之间只差一个动作。", "此后遇到关口，你学会先迈半步再说。", "你写下的那句话，后来成了很多人的铠甲。", "更深一环：你不再用「如果当初」惩罚自己。", "更深一环：你开始相信，选择比天赋更像一个人才。"],
      life: ["平行世界的你，把那天的勇气写进了日记第一页。", "你在深夜的便利店，请陌生人喝了一罐汽水。", "你成了那个会在别人犹豫时推一把的人。"],
    },
    {
      dimension: "命运 / 偶然",
      chain: ["那天的雨，恰好让你多等了一班地铁。", "车厢里坐着的人，成了你十年后最关键的引路人。", "一条没发出的消息，阴差阳错避开了一次更大的遗憾。", "更深一环：你后来才懂，错过有时是另一种护送。", "更深一环：命运把剧本撕了，又递给你一支笔。"],
      life: ["平行世界的你，在地铁玻璃上看见自己久违的笑。", "你收到一封迟到三年的感谢信。", "你终于把手里那张旧车票，夹进了新书的第一页。"],
    },
  ].slice(0, width);

  return {
    ok: true,
    demo: true,
    engine: "multinode-recursive",
    config: { width, depth },
    narrative: {
      worldTitle: "那扇没关上的门",
      branchingPoint: "你多停留了三秒，听见了那句没说出口的挽留。",
      worldSketch: "差一步，就是另一种人生。",
      dimensions: dims,
      mergedChain: [
        "你回了头，关系没有断。",
        "你迈了半步，事业有了起点。",
        "你写下勇气，成了别人的铠甲。",
        "你错过一班车，却遇见引路人。",
        "多年后你才懂：很多平行人生，差的只是当时那一步。",
      ],
      ending: "原来很多平行人生，差的只是当时那一步的勇气。",
      goldenLine: "晚一步，也是一辈子。",
      imagePrompt: "电影感暖色调，一对年轻恋人在城市夜路路灯下转身相拥，霓虹虚化，温柔治愈氛围",
      image: null,
      nodes: { seed: 1, causal: width, deepen: width * depth, synthesis: 1, image: 1, total: 2 + width * (1 + depth) + 1 },
    },
    image: null,
    note: "当前为 Demo 示例（多节点递归结构已完整展示）。配置 .env 的 MINIMAX_API_KEY（及 GROUP_ID）后，将由 MiniMax-M3 真实跑通多节点推演并生成 image-01 配图。",
  };
}

// ---------- 主接口 ----------
app.post("/api/causality", async (req, res) => {
  const { event, alternative, tone, width: w, depth: d } = req.body || {};
  if (!event || !alternative) {
    return res.status(400).json({ error: "请填写「原事件」和「如果当时…」" });
  }
  const width = clamp(parseInt(w, 10) || CAP.widthDef, CAP.widthMin, CAP.widthMax);
  const depth = clamp(parseInt(d, 10) || CAP.depthDef, CAP.depthMin, CAP.depthMax);

  if (!hasKey) {
    return res.json(buildDemo(event, alternative, width, depth));
  }
  try {
    const narrative = await runEngine(event, alternative, tone, width, depth);
    res.json({ ok: true, engine: "multinode-recursive", config: { width, depth }, narrative });
  } catch (e) {
    // Key 失效（401 / invalid api key）时优雅降级到 Demo，并附说明
    if (e.status === 401 || /invalid api key|authorized_error|2049/.test(e.message || "")) {
      const demo = buildDemo(event, alternative, width, depth);
      demo.keyError =
        "MiniMax Key 校验失败（401 / invalid api key），已自动退回 Demo 模式。请检查 .env 中的 MINIMAX_API_KEY 与 MINIMAX_GROUP_ID 是否匹配。";
      return res.json(demo);
    }
    console.error("因果律推演失败：", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true, hasKey, engine: "multinode-recursive" }));

app.listen(PORT, () => {
  console.log(`\n  AI 因果律 · 平行人生生成器（多节点递归推理引擎）  →  http://localhost:${PORT}`);
  console.log(`  MiniMax Key: ${hasKey ? "已配置 ✅" : "未配置（Demo 模式）⚠️"}\n`);
});
