// AI 因果律 · 前端逻辑
const $ = (id) => document.getElementById(id);

const STEPS = ["seed", "fork", "chain", "render"];

// 一键示例
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    $("event").value = chip.dataset.ev || "";
    $("alt").value = chip.dataset.alt || "";
    $("demoHint").textContent = "";
    window.scrollTo({ top: document.querySelector(".input-panel").offsetTop - 20, behavior: "smooth" });
  });
});

$("run").addEventListener("click", runCausality);
$("reset").addEventListener("click", resetAll);
$("shareCard").addEventListener("click", buildShareCard);
$("copyText").addEventListener("click", copyShareText);

async function runCausality() {
  const event = $("event").value.trim();
  const alt = $("alt").value.trim();
  const tone = $("tone").value;
  if (!event || !alt) {
    $("demoHint").textContent = "⚠️ 请把「原事件」和「如果当时…」都填上。";
    return;
  }
  $("demoHint").textContent = "";
  $("run").disabled = true;

  // 进度面板
  $("result").classList.add("hidden");
  $("progress").classList.remove("hidden");
  STEPS.forEach((s) => {
    const el = document.querySelector(`.step[data-step="${s}"]`);
    el.classList.remove("active", "done");
  });

  // 分步点亮
  for (const s of STEPS) {
    const el = document.querySelector(`.step[data-step="${s}"]`);
    el.classList.add("active");
    await sleep(s === "render" ? 1400 : 900);
    el.classList.remove("active");
    el.classList.add("done");
  }

  try {
    const resp = await fetch("/api/causality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, alternative: alt, tone }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "推演失败");
    renderResult(data);
  } catch (e) {
    $("demoHint").textContent = "⚠️ " + e.message;
  } finally {
    $("run").disabled = false;
  }
}

function renderResult(data) {
  const n = data.narrative;
  $("progress").classList.add("hidden");
  $("result").classList.remove("hidden");

  $("worldTitle").textContent = n.worldTitle || "你的平行人生";

  const chain = $("chain");
  chain.innerHTML = "";
  (n.causalityChain || []).forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c;
    chain.appendChild(li);
  });

  const life = $("life");
  life.innerHTML = "";
  (n.parallelLife || []).forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c;
    life.appendChild(li);
  });

  $("ending").textContent = n.ending || "";
  $("golden").textContent = n.goldenLine || "";

  // 图片
  const wrap = $("imageWrap");
  if (data.image && data.image.value) {
    const img = $("worldImg");
    img.src = data.image.type === "b64" ? `data:image/png;base64,${data.image.value}` : data.image.value;
    wrap.classList.remove("hidden");
    img.onload = () => (img.dataset.loaded = "1");
  } else {
    wrap.classList.add("hidden");
  }

  if (data.demo) {
    $("demoHint").textContent = "✅ 当前为 Demo 示例。配置 .env 的 MiniMax Key 后生成你的专属平行人生 + 配图。";
  } else {
    $("demoHint").textContent = "";
  }

  window.__lastData = data;
}

// 分享卡：把配图 + 金句合成一张可下载 PNG
async function buildShareCard() {
  const data = window.__lastData;
  if (!data) return;
  const n = data.narrative;
  const canvas = $("card");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0a1a");
  bg.addColorStop(1, "#1a0f2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部标题
  ctx.fillStyle = "#8b7bff";
  ctx.font = "600 34px 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AI 因果律 · 我的平行人生", W / 2, 90);

  // 配图
  let y = 140;
  const imgEl = $("worldImg");
  if (imgEl && imgEl.src && imgEl.dataset.loaded) {
    await drawCover(ctx, imgEl, 60, y, W - 120, 560);
    y += 580;
  } else {
    // 无图时的占位渐变块
    const ph = ctx.createLinearGradient(60, y, W - 60, y + 360);
    ph.addColorStop(0, "#8b7bff");
    ph.addColorStop(1, "#ff7eb6");
    ctx.fillStyle = ph;
    ctx.fillRect(60, y, W - 120, 360);
    y += 380;
  }

  // 平行人生标题
  ctx.fillStyle = "#fff";
  ctx.font = "800 52px 'PingFang SC', sans-serif";
  ctx.fillText(n.worldTitle || "", W / 2, y + 60);

  // 金句
  ctx.fillStyle = "#ff7eb6";
  ctx.font = "700 44px 'PingFang SC', sans-serif";
  ctx.fillText(`“${n.goldenLine || ""}”`, W / 2, y + 150);

  // 底部水印
  ctx.fillStyle = "#9a93c4";
  ctx.font = "400 26px 'PingFang SC', sans-serif";
  ctx.fillText("由 MiniMax 驱动的平行世界模拟器", W / 2, H - 50);

  // 下载
  const link = $("downloadLink");
  link.href = canvas.toDataURL("image/png");
  link.download = `平行人生-${n.worldTitle || "causality"}.png`;
  link.click();
}

function drawCover(ctx, img, x, y, w, h) {
  return new Promise((resolve) => {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    // 圆角裁剪
    ctx.save();
    roundRect(ctx, x, y, w, h, 24);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    resolve();
  });
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function copyShareText() {
  const data = window.__lastData;
  if (!data) return;
  const n = data.narrative;
  const text =
    `【AI 因果律 · 我的平行人生】\n` +
    `原事件：${$("event").value.trim()}\n` +
    `如果当时：${$("alt").value.trim()}\n\n` +
    `🌌 ${n.worldTitle}\n` +
    `${n.ending || ""}\n` +
    `“${n.goldenLine || ""}”\n` +
    `#AI因果律 #平行人生`;
  try {
    await navigator.clipboard.writeText(text);
    $("demoHint").textContent = "✅ 分享文案已复制，去朋友圈/小红书粘贴吧。";
  } catch {
    $("demoHint").textContent = "复制失败，请手动选择文本。";
  }
}

function resetAll() {
  $("result").classList.add("hidden");
  $("event").value = "";
  $("alt").value = "";
  window.__lastData = null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
