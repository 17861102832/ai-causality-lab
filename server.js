// AI 因果律 · 平行人生生成器 — 后端代理
// 职责：把前端请求转给 MiniMax（文本 MiniMax-M3 + 出图 image-01），
//       不把 API Key 暴露给浏览器，并做结构化解析与容错。
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.MINIMAX_API_KEY;
const GROUP_ID = process.env.MINIMAX_GROUP_ID || "";
const TEXT_MODEL = process.env.MINIMAX_TEXT_MODEL || "MiniMax-M3";
const CHAT_BASE = process.env.MINIMAX_CHAT_BASE || "https://api.minimax.io/v1";
const IMAGE_BASE = process.env.MINIMAX_IMAGE_BASE || "https://api.minimax.io/v1";

const hasKey = Boolean(API_KEY && API_KEY !== "your_minimax_api_key_here");

// ---------- 工具：从模型输出里抠出 JSON ----------
function extractJSON(text) {
  if (!text) return null;
  // 去掉 ```json ... ``` 围栏
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // 截取第一个 { 到最后一个 }
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

// ---------- 步骤一：生成平行人生叙事（结构化 JSON） ----------
async function generateNarrative(event, alternative, tone) {
  const sysPrompt = `你是「因果律引擎」——一台为普通人重写的平行世界模拟器。
用户的输入是【真实发生过的遗憾】，你要基于一个微小的不同选择，推演出一条完整、可信、有情绪的平行人生时间线。

要求：
1. 只服务这一个用户，不要宏大历史/世界线，要具体到"他/她"的生活细节。
2. 因果链必须环环相扣：一个选择如何引发后续一连串不同的人生节点。
3. 情绪真实，允许遗憾、释然、温柔或反转，但杜绝说教。
4. 输出严格 JSON（不要任何解释、不要代码围栏），结构如下：
{
  "worldTitle": "给这条平行人生起一个有力量的短标题（≤14字）",
  "causalityChain": ["第一环因果：…", "第二环因果：…", "第三环因果：…", "第四环因果：…"],
  "parallelLife": ["平行人生节点1（具体场景）", "平行人生节点2", "平行人生节点3", "平行人生节点4"],
  "ending": "这条平行人生最终的落点（1-2句，有画面感）",
  "goldenLine": "一句金句（≤20字，供分享卡使用，情绪极致）",
  "imagePrompt": "用中文写一段用于 AI 绘画的视觉描述（电影感、有氛围、可落地成图，≤60字，描述这条平行世界的代表画面）"
}`;

  const userPrompt = `原事件（真实遗憾）：${event}\n如果当时：${alternative}\n语气倾向：${tone || "真实、克制、有温度"}`;

  const body = {
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 1200,
  };
  if (GROUP_ID) body.group_id = GROUP_ID;

  const resp = await fetch(`${CHAT_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`MiniMax chat 失败 ${resp.status}: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJSON(content);
  if (!parsed) throw new Error("叙事解析失败，模型未返回合法 JSON");
  return parsed;
}

// ---------- 步骤二：MiniMax image-01 出图 ----------
async function generateImage(prompt) {
  const body = {
    model: "image-01",
    prompt,
    aspect_ratio: "16:9",
    response_format: "url",
    n: 1,
  };
  if (GROUP_ID) body.group_id = GROUP_ID;

  const resp = await fetch(`${IMAGE_BASE}/image_generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`MiniMax image 失败 ${resp.status}: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  // 兼容 url 与 b64 两种返回
  const url = data?.data?.image_url?.[0] || data?.data?.image_urls?.[0];
  const b64 = data?.data?.b64_image?.[0] || data?.data?.b64_images?.[0];
  if (url) return { type: "url", value: url };
  if (b64) return { type: "b64", value: b64 };
  throw new Error("MiniMax image 未返回可用图片");
}

// ---------- 主接口 ----------
app.post("/api/causality", async (req, res) => {
  const { event, alternative, tone } = req.body || {};
  if (!event || !alternative) {
    return res.status(400).json({ error: "请填写「原事件」和「如果当时…」" });
  }
  if (!hasKey) {
    // Demo 模式：未配置 Key 时返回示例，保证页面可玩可展示
    return res.json(buildDemo(event, alternative));
  }
  try {
    const narrative = await generateNarrative(event, alternative, tone);
    let image = null;
    try {
      image = await generateImage(narrative.imagePrompt || narrative.worldTitle);
    } catch (e) {
      console.warn("出图失败（叙事仍返回）：", e.message);
      image = null;
    }
    res.json({ ok: true, narrative, image });
  } catch (e) {
    console.error("因果律推演失败：", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ---------- Demo 示例（无 Key 也能看效果） ----------
function buildDemo(event, alternative) {
  return {
    ok: true,
    demo: true,
    narrative: {
      worldTitle: "那扇没关上的门",
      causalityChain: [
        "你多停留了三秒，听见了那句没说出口的挽留。",
        "犹豫被打破，你回了头，关系没有在那一刻断掉。",
        "半年后你们一起搬进带阳台的出租屋，养了一只猫。",
        "三年后的今晚，你不再是一个人刷着旧照片失眠。",
      ],
      parallelLife: [
        "平行世界的你，在那个路口转身，说了一句「等一下」。",
        "你们重新开始，笨拙但真实地重新认识彼此。",
        "第一个冬天，两个人挤在厨房煮酒酿圆子。",
        "如今你手机里存着上千张合影，而不是一堆未发送的草稿。",
      ],
      ending: "原来很多平行人生，差的只是当时那一步的勇气。",
      goldenLine: "晚一步，也是一辈子。",
      imagePrompt:
        "电影感暖色调，一对年轻恋人在城市夜路的路灯下转身相拥，霓虹虚化，温柔治愈氛围",
    },
    image: null,
    note: "当前为 Demo 示例。配置 .env 中的 MINIMAX_API_KEY 后将生成真实专属平行人生与 MiniMax 配图。",
  };
}

app.get("/health", (_req, res) => res.json({ ok: true, hasKey }));

app.listen(PORT, () => {
  console.log(`\n  AI 因果律 · 平行人生生成器  →  http://localhost:${PORT}`);
  console.log(`  MiniMax Key: ${hasKey ? "已配置 ✅" : "未配置（Demo 模式）⚠️"}\n`);
});
