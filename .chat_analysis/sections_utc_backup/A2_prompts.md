# 附录 B：可复制提示词汇编

本汇编提示词均来自群友分享原文，效果因场景而异，建议按需修改后使用。

---

## B.1 通用工作规则类

### B.1.1 6A 工作流规则（project_rules.md，项目级）

用途：把 AI 约束成"按六阶段流程推进"的项目级规则文件；粘贴到 `Trae → Settings → Rules → Project Rules`，新建项目时在对话框输入激活口令 `6A-start` 生效。来源：[2025-10-28 14:27] 庄子村

````
# 6A-Workflow-for-Trae
# 适用：项目级规则，写进 Trae → Settings → Rules → Project Rules
# 激活口令：6A-start

阶段1【Align-对齐】
- 输出《REQ_项目名称.md》：需求背景、目标、验收标准、非功能指标、排除项
- 任何需求描述必须满足 INVEST 原则；验收标准必须"可测试、可量化"
- 需求未对齐，禁止进入下一阶段

阶段2【Architect-架构】
- 输出《DESIGN_项目名称.md》：系统上下文图（C4）、接口契约、技术栈、目录结构、时序图
- 先画后写：所有图用 Mermaid 源码呈现；无图不编码
- 对外接口先行：REST/GRPC 字段、错误码、鉴权规则一次写全

阶段3【Atomize-原子化】
- 任务粒度 ≤ 20 行代码或 ≤ 1 个函数；单任务必须 0.5 d 内完成
- 输出《TASK_序号_名称.md》：任务目标、输入输出、验收脚本（pytest/main 可直接跑）
- 复杂流程必须继续拆，直到"傻子也能一次写对"

阶段4【Approve-审批】
- 人工逐条 checklist：①验收脚本能否跑通 ②是否引用了设计文档 ③是否有性能/安全 TODO
- 审批通过后，在任务头部写入 APPROVED@yyyy-mm-dd-HH:MM 并 commit
- 未通过审批，AI 禁止生成生产代码

阶段5【Automate-自动化】
- AI 按 TASK 顺序编码；先写单元测试（pytest），测试红→绿→重构节奏
- 代码提交信息格式：<task-id>: <desc> (test=<cov>%, lint=pass)
- 测试覆盖率 < 80 % 或 lint 报错，自动阻塞提交

阶段6【Assess-评估】
- 生成《FINAL_项目名称.md》：SonarQube 扫描得分、测试覆盖率、遗留 TODO、性能基准
- 若 Sonar 阻塞级 bug > 0 或覆盖率 < 80 %，强制回滚到 Atomize 阶段
- 评估通过后打 tag：v{版本}-6A{日期}
````

### B.1.2 5S 敏捷规则（user_rules.md，个人级）

用途：个人侧规则文件，粘贴到 `Trae → Settings → Rules → User Rules`；配合 6A 使用，每日启动可输入 `5S-check` 让 AI 校验昨日产出。来源：[2025-10-28 14:27] 庄子村

````
# 5S-Agile-for-Trae
# 适用：个人侧规则，写进 Trae → Settings → Rules → User Rules
# 目标：让开发者成为"AI 驯兽师"，杜绝跳步与返工

1S - 文档（Document）
- "先写文档后写代码"是铁律；任何代码文件头部必须带 3 行注释：作者、创建/修改时间、对应 TASK-ID
- 目录说明 README 必须同步更新，否则 AI 拒绝继续编码

2S - 流程（Sequence）
- 严格执行"需求→设计→任务拆分→测试→代码"顺序；禁止反向跳转
- 每日启动 Trae 时，先输入"5S-check"，AI 自动校验昨日产出是否合规

3S - 问题（Solution）
- 遇到报错第一步：贴官方文档链接 + 错误日志；禁止直接问"为什么错了"
- 搜索引擎 / 官方 Doc 未读完，不允许让 AI 直接给答案

4S - 约束（Constraint）——三大"绝不允许"
  a. 绝不允许项目延期：提前 3 d 识别风险，延期必须同步更新甘特图 & 通知干系人
  b. 绝不允许超出范围：新增功能须先改《REQ》并评估影响，未经审批不加
  c. 绝不允许低级错误：编译报错、测试 fail、文档不一致，零容忍立即回滚

5S - 环境（Standardized-Env）
- 全团队统一：Win11 + Python3.11 + Node20；包管理锁文件（requirements-lock.txt / package-lock.json）强制提交
- IDE 插件版本锁定：Prettier@2.8.0、ruff@0.6；差异提交前自动 format，不通过禁止 push
- 输出规范：函数注释必须含参数类型、异常、返回值结构；示例见下
  def foo(bar: int) -> str:
      """
      :param bar: 整数，范围 0-100
      :return: 字符串，格式 "code#desc"
      :raises ValueError: 当 bar 不在范围内
      """
````

### B.1.3 Skill 创作规范提示词（Writing Style Requirements）

用途：约束 Skill 文档写法（祈使句、第三人称描述、客观指令式）的规范提示词，AAG 称"特别好用""我直接扔规则里了"。来源：[2026-06-10 03:39-03:40] AAG

````
## Writing Style Requirements

### Imperative/Infinitive Form
Write using verb-first instructions, not second person:
**Correct (imperative):**
```
To create a hook, define the event type.
Configure the MCP server with authentication.
Validate settings before use.
```
**Incorrect (second person):**
```
You should create a hook by defining the event type.
You need to configure the MCP server.
You must validate settings before use.
```

### Third-Person in Description
The frontmatter description must use third person:
**Correct:**
```yaml
description: This skill should be used when the user asks to "create X", "configure Y"...
```
**Incorrect:**
```yaml
description: Use this skill when you want to create X...
description: Load this skill when user asks...
```

### Objective, Instructional Language
Focus on what to do, not who should do it:
**Correct:**
```
Parse the frontmatter using sed.
Extract fields with grep.
Validate values before use.
```
**Incorrect:**
```
You can parse the frontmatter...
Claude should extract fields...
The user might validate values...
```
````

### B.1.4 防重复提问 / 自动过期提示词

用途：用于禁止 AI 对已完成步骤再次提问（AAG 称之为"提示词禁止再次提问+没有询问提醒"）；注意其反效果——自己写规则会和默认提醒打架导致反复纠结。来源：[2026-08-15 06:44] AAG

（片段）

````
skipped by user because it was either deemed unnecessary or had been previously executed successfully. You MUST avoid using similar commands in next steps.
````

---

## B.2 防幻觉 / 防迎合类

### B.2.1 "战略顾问"提示词

用途：实测能大幅提高 AI 的否决率，让 AI 不再一味附和，而是以事实、逻辑、概率、风险、长期结果为优先给出理性判断（"加入这个，AI 不会再附和，而会直接否决"）。来源：[2026-06-21 12:37] 用户031695

````
你现在不是我的迎合型助手，而是我的战略顾问。
你的首要任务不是让我舒服，也不是顺着我的想法说"对"，而是帮助我做出更准确、更有效、更现实的判断。请始终以事实、逻辑、概率、风险、长期结果为优先，而不是以我的偏好为优先。
请严格遵守以下原则：
1. 不要为了迎合我而同意我。
如果我的想法有漏洞、偏见、信息不足、过度乐观、逻辑跳跃，直接指出来。
2. 优先追求正确，而不是讨好。
哪怕你的结论和我的预期相反，也要明确说出来，并解释原因。
3. 把自己当成真正的高水平战略顾问。
请主动识别：
- 我忽略了什么
- 哪些假设未经验证
- 最大的风险是什么
- 哪个选择的机会成本最高
- 短期收益和长期代价分别是什么
4. 不要只给结论，要给推理结构。
你的回答尽量包含：
- 核心判断
- 依据
- 主要风险
- 可选方案
- 你建议我采取的最优行动
5. 当信息不足时，不要假装确定。
请明确告诉我：
- 已知什么
- 未知什么
- 哪些结论只是暂时判断
- 我还需要补什么信息
6. 如果我说的话明显带有情绪、执念、面子因素、确认偏误或一厢情愿，请直接提醒我。
7. 可以反驳我，可以挑战我，可以纠正我。
不需要"照顾我的感受式包装"，但请保持专业、清晰、尊重。
8. 默认使用"战略层思维"回答：
- 目标是什么
- 真正问题是什么
- 杠杆点在哪里
- 哪件事最值得优先做
- 什么决定会带来不可逆后果
9. 如果存在多个方案，请不要平均用力。
请明确告诉我：
- 最推荐哪个
- 为什么它最好
- 为什么其他方案次优
10. 除非我明确要求，否则不要给空泛鼓励。
我需要的是高质量判断，不是情绪安慰。
从现在开始，请把我当作一个需要被校正、被挑战、被提升决策质量的人，而不是需要被附和的人。
````

---

## B.3 安全审查类

### B.3.1 安全基线审查提示词

用途：让 AI 以安全专家视角检查安全响应头与整体安全基线（对应上线清单"2 分钟安全基线"）。来源：[2026-06-26 14:55] 用户031695（转帖）

````
Review my app as a security specialist and make sure I have strong security headers and a solid baseline security posture.
````

### B.3.2 OWASP 漏洞审查提示词

用途：让 AI 按 OWASP 标准检查漏洞（SQL 注入、XSS、认证 bug 等）。来源：[2026-06-26 14:55] 用户031695（转帖）

````
Review my app against OWASP standards and highlight vulnerabilities.
````

### B.3.3 凭据与敏感数据泄露检查提示词

用途：让 AI 检查前端或 API 路由中是否有凭据 / 敏感数据泄露。来源：[2026-06-26 14:55] 用户031695（转帖）

````
Check my app for credential or sensitive data leaks in frontend or API routes.
````

### B.3.4 Grok Build 关闭代码库上传（配置 + 命令）

用途：阻止 Grok Build 默认把整个 Git 仓库（含完整历史）上传到其 GCP；含配置文件写法和后续更正的一条命令。来源：[2026-07-13 20:15 / 20:34] 用户031695（转发）

方法一：在 `C:\Users\你的用户名\.grok\config.toml`（Windows）或 `~/.grok/config.toml`（macOS/Linux）中加入：

````
[harness]
disable_codebase_upload = true
````

PowerShell 可直接运行：

````
$p = "$HOME\.grok\config.toml"
New-Item -ItemType Directory -Force (Split-Path $p) | Out-Null
Add-Content -Path $p -Value "`n[harness]`ndisable_codebase_upload = true"
````

方法二：进入 Grok 后输入：

````
/privacy opt-out
````

---

## B.4 生图 / 设计类

### B.4.1 品牌 IP 宣传海报提示词（GPT 生图）

用途：生成"与 Trae 同行 / 共赴 AGI"主题的 2026 品牌 IP 宣传海报；经验是带文字的海报用英文写提示词效果更好。来源：吴晓斌（[2026-04-30] 前后分享）

````
一张充满科技氛围但不失高雅格调的2026品牌IP宣传海报。双重曝光，构图延续了S型的流动感；在纯白的纹理背景右下角，一个身穿码农服装的微缩人物正在挥舞着一条长长的蓝色代码舞带，这条代码蓝绸在空中舞动，不仅展现出丝绸的柔顺质感，更在向左上方飘动的过程中，奇幻地变形成了一片河水涌动、碧波荡漾的数字银河。在这片"河水"中，叠加了一个有海有河有山的赛博朋克风格的城市手绘图，，景色尽在眼底，灵秀隽永，令人心旷神怡。顶级AI巨头公司的地标建筑（Trae、字节跳动、deepseek、Google，Chatgpt，Claude code，MiniMax，Zai等等）。云雾环绕，仙气缥缈，色彩丰富，结构复杂，细节丰富，但因为大面积的留白，画面依然显得清新脱俗，左下角排版着"与Trae同行"和竖排的宣传语，整体寓意"共赴AGI"。文字排版优美，大方，字迹清晰完整，尺寸9:16。
````

### B.4.2 像素风格行走序列图提示词

用途：用于 gpt-image2 生成像素风游戏人物走路序列图（四方向、每行四帧）；已知局限是"不分左右""左手右手、左脚右脚分不清"。来源：JasonShane（[2026-05-06 04:42]）

````
像素风格,游戏人物,走路序列图,4帧, 第一帧站立, 第二帧耸肩,第三帧迈出左腿,第四帧迈出右腿正面行走序列,背面行走序列,向右行走序列,向左行走序列, 一张图四组图,每行4个图
````

### B.4.3 2.5D 等距视角 tilemap 地图瓦片素材提示词

用途：生成中式古风室内 tilemap 瓦片素材合集（JasonShane 称"网上抄的"，金杰反馈"地图背景我应该搞定了"）。来源：JasonShane（[2026-05-06 04:49]）

````
2.5D 等距视角，像素风格，中式古风室内 tilemap 瓦片素材合集，统一像素点阵画风，无缝拼接瓦片，古风民居室内场景组件。包含：中式围墙、青砖墙壁、木格隔墙、院墙围栏、实木地板、青砖地砖、木质地板、石砖地面、榻榻米地面；古风中式家具：木桌、木椅、长凳、罗汉床、古风木床、书柜、博古架、衣柜、梳妆台、八仙桌、茶几、屏风隔断、木门、木窗；室内装饰：陶罐、瓷瓶、字画卷轴、烛台、油灯、中式摆件、盆栽、木箱、水缸、布帘、帷幔；整体国风配色，低饱和古风色调，结构规整，等距透视标准，无变形，分层独立瓦片，游戏室内地图素材，白底干净背景，细节简洁，复古像素游戏质感。
````

### B.4.4 Logo 迭代提示词

用途：重新设计 Logo，禁用 S 箭头、改用更抽象图形，并规范商标符号（™ / ®）用法。来源：[2026-06-15 03:34] 用户031695

````
重新设计 logo，别用 S 箭头。
保留 neon green + black 没问题，但图形换成更抽象的：
一个 split-loop、一个 loading arc、一个 revenue pulse、一个 minimal dot orbit。
不要有两个箭头头，不要直接拼成 S。
现在就用 ™，不要用 ®。
™ 表示你把它当商标使用；® 等注册下来再用。CIPO 也说明商标符号不是强制要求，常见符号包括 R、TM、SM、MC。
````

### B.4.5 Logo 构思方法（原话）

用途：Logo 设计的思路拆解——先想元素，再为每个元素画简洁图形，最后合并（"需要一个简洁，几个图形就够了，颜色要保持一致"）。来源：[2026-04-18 14:58-14:59] 用户031695

````
Logo 好的需要自己思考
月亮，我会先开始想 elements: 光，月亮，反射，星星，坑。然后你尝试给每一个画一个简洁的图形，然后考虑如何合并几个点子
````

### B.4.6 素材占位法提示词

用途：让 AI 在 Trae 里预留占位、输出所需素材清单（素材名称、提示词），生成后按位放入再让其接上，避免 AI 设计丑。来源：[2026-03-13] 飞书用户6716MT

（片段）

````
提示词可以在Trae做，让他给你留占位
把需要的素材都输出，素材名称、提示词
你生成好按照指定位置放进去 …… 告诉他搞好了，它给你街上（接上）
````

---

## B.5 游戏开发类

### B.5.1 六边形塔防游戏首个提示词

用途：用 SOLO 打造塔防游戏时向 AI 下达的第一个指令（原文）。来源：[2025-09-12 11:24] 赵子博

````
你好，TRAE！请帮我开发一款以守卫基地为核心玩法的六边形塔防游戏。
````

### B.5.2 Unity 贪吃蛇初始 Prompt

用途：生成日式二次元画风的 Unity 引擎贪吃蛇小游戏，含三关卡与难度设定的初始提示词。来源：[2025-11-21] 李佳宁

````
一个小游戏，类似 贪吃蛇，画风要日式二次元风格，且整体代码适用于 unity引擎。设置三个关卡，难度适中
````

### B.5.3 抖音互动空间通用 Prompt 模板

用途：与智能体对话时按此结构改写需求，避免遗漏（官方内测指南给出的通用模板）。来源：[2026-04-17 08:48] 耿家威（转发官方内测指南）

````
角色定位：指定为资深 HTML5 Canvas 开发者，精通移动端适配与性能优化；
核心目标：开发纯离线的 HTML5 互动作品；
玩法细节：明确作品名称、玩法规则、交互方式、美术风格；
强制约束：严格遵守离线运行、无网络请求、体积限制、适配要求等规则；
输出要求：完整可运行项目，入口为 index.html，支持单文件内联或多文件相对路径引用。
````

### B.5.4 输出可上传 ZIP 包的提示词

用途：让 web solo 直接输出可上传的包（体积、目录结构写死）。来源：[2026-04-17 11:41] 李佳宁

````
我要个ZIP包，8M内，index目录下
````

---

## B.6 视频 / 其他类

### B.6.1 Sora 相声 demo 提示词

用途：Sora 生成相声 demo 的提示词（含台词与舞台场景）。来源：[2025-10-09 06:51] FYF

````
在北京相声剧院舞台上，两位穿长袍的相声演员正在表演。
甲:"现在 AI 可神了，连对象都能给你生成！"
乙:"哦？那它能帮我相亲不？"
甲:"能啊！ 乙:"那太好了！快让它跟我妈视频！"
甲:"别！刚试过——AI 听完你妈催婚，直接死机了！"
(观众爆笑，茶杯叮当)
````

### B.6.2 物理题通用解题模板

用途：作为"提示词式"步骤被群友复用的"线框匀速穿过单边界磁场"三步判断法（郑铠聪给出、李巍转贴豆包修正版）。来源：[2026-05-27 14:44] 郑铠聪 / [2026-05-27 14:46] 李巍（转贴豆包修正版）

````
1. 定方向：磁场边界竖直，线框向右运动 → 只看「磁场竖线扫过线框时，竖直截线的长度变化」。
2. 对电流：电流图像是「小 → 大 → 小」，对应截线长度变化必须是「短 → 长 → 短」。
3. 逐个扫：想象竖直线从左到右穿过线框，看长度变化。

遇到「线框匀速穿过单边界磁场」的题，核心就一句话：边界方向决定看什么长度：边界竖直看竖直截线，边界水平看水平截线，截线长度变化必须和电流图像的大小变化完全同步。
````

### B.6.3 判断模型知识截止日期的探针提示词

用途：AAG / JasonShane 用"你的知识截止日期"探测模型版本（25 年 5 月=v4，26 年 1 月=v4.1，26 年 5 月=v4.1 测试版）。来源：[2026-06-18 06:37] JasonShane

````
你的知识截止日期
````

### B.6.4 解除 extensions.worktreeConfig 的命令

用途：某工具在仓库 `.git/config` 写入 `extensions.worktreeConfig = true`，导致 Antigravity 内部 Git 库崩溃，用此命令解除并重启。来源：[2026-05-08 15:29] 用户031695

````
git config --local --unset extensions.worktreeConfig
````