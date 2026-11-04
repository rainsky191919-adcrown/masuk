# 手机优先优化：QA 与真实 Android 验收

日期：2026-11-04（Asia/Kuala_Lumpur）。结果：**PASS after auto-fix**。

QA：<https://masuk.pintumasuk.workers.dev/>。最终应用 SHA：`6280ffa25a08c800b3b2cf8645f317f615fd1b7a`，Worker `masuk`，部署 `28bc44a5`，Ready／100%。后端项目 `meqmyxaxnpntjlerrxcb`，共享模式开启。**没有发布 Production、迁移数据库、初始化或修改角色。**

## 发布与补修

| 应用 checkpoint | QA 部署 | 结果 |
|---|---|---|
| `724cad9` | `d6223114` | 发现真实“已有认可＋近期反馈”组合使首条要求在短屏首屏下方；未视为验收通过。 |
| `1241555` | `86f94d7e` | 将认可信息保留在可展开的资料来源区，压缩结果栏留白；完整浏览器与 Android 功能验收通过。截图复核另发现次级复制按钮继承浅色原生底。 |
| `6280ffa` | `28bc44a5` | 补齐次级按钮背景、边框及内边距。最终浏览器及 Android 针对性复验通过；冻结本 SHA。 |

三个 checkpoint 均已依次推送 main。后续验收文档提交不改变已验收应用 SHA。回滚可用：前一部署 `86f94d7e`；本轮开始前的已验收版本 `53e0df19` 仍保留。不得用后续文档提交重建并冒充已验收应用版本。

## 证据与验收范围

- 最终本地离线 Chromium：39 项通过；首页逻辑／组件 25 案例、构建配置 4 案例、后台 40 组通过。QA 构建与预检通过。
- 完整共享 QA 浏览器检查：46 项通过，覆盖 320／390／1318 宽度、短屏首条规则、真实认可和反馈组合、近期反馈筛选、搜索数量、两类空态及恢复、规则→报告→讨论顺序、反馈／发帖按需打开与焦点、账号菜单、卡片展开、更多操作、分页及运行时日志。
- 完整交互验收运行于 `1241555`；最终 `6280ffa` 仅补 CSS。两版发布 JavaScript 字节完全相同，SHA256 均为 `bfa3d1f1b667c8e47cc422ece77b88f9f454920a6c22cce896d9afc2f963cd5c`。最终包另执行 12 项浏览器复验，包括最终 SHA、320／390／1318 无溢出、首屏摘要、复制按钮透明底／44 px 高、反馈入口、近期筛选、恢复及无错误日志。
- 真实 Android：Huawei VOG-L29，Android 10，Chrome 156.0.8078.79。完整检查版本、首页、账号菜单、主导航、近期反馈筛选、规则与未核实报告、反馈表单展开、详细筛选数量、零结果、Bukit 搜索 2 条、保留搜索的筛选恢复、纯名称空态、详情返回保留搜索、四项未知展开及更多操作。最终包再次核对公开 build-info 为 `6280ffa`，首页首条要求可见，次级按钮深色主题正常，恢复空搜索／全部21条／关闭菜单，登录保留。
- 最终线上四个静态资源（首页、CSS、JS、build-info）均 HTTP 200，SHA256 与对应本地 QA 产物完全一致。构建信息、后端项目和共享模式一致。

短屏真实 QA 首条摘要底部约 654.16 px，位于 674 px 视口内；Android 原始截图为 1080 × 2340，含浏览器栏，首条摘要完整可见。单条司机报告仍为“反馈不足，暂未评分”，不会改写地点规则。现有 21 个地点、1 个有近期反馈的地点及原有讨论／认可／到访报告均保留。

本地证据目录：`release/20261104-mobile-first/`（已忽略，不上传截图或构建包）。结构化结果：`browser-checks.json`、`browser-final-smoke.json`、`online-artifact-hashes.json`、`android-acceptance.json`、`preflight-qa.json`。发布清单见 [manifest.json](../../releases/20261104-mobile-first/manifest.json)。

已打开复核截图：`cloudflare-ready.png`、`browser-final-home-390.png`、`browser-final-more-actions.png`、`android-build-final.png`、`android-final-home.png`、`android-feedback-open.png`、`android-more-actions-final.png`。其余步骤截图同目录保留，并区分补修前后，不把旧截图当成最终包。

## 自动恢复与边界

Git 索引、远端网络、ADB daemon 的沙箱限制通过平台审核的同范围执行恢复；没有绕过拒绝或安全门。Cloudflare 插件仍连接旧账号，因此使用同一已批准浏览器，核对正确账号、Worker、域名及当前部署后发布。控制台中的 Worker 通道名“Production”指 `masuk` 的活动通道；本任务业务环境由独立 QA Worker／域名／后端项目确认，并非正式 Worker `my`。

Android 输入法曾吞掉网址连字符并保留未提交候选。清空地址输入、使用已知资源的标准 URL 编码、提交候选并点选经核实的准确建议后恢复；全程在同一 Chrome 标签完成，最终地址为准确 build-info.json。未使用错误页面作验收证据。HTTP `/index.html` 规范跳转通过使用实际首页 `/` 进行哈希核对。

本次没有提交地点、资料认可、反馈、帖子、回复、举报或角色变更，也没有清理先前已有内容。仅打开并关闭现有反馈／发帖表单，不改字段、不保存；不退出真实账号，不进行外部地图导航。没有完整 WCAG、屏幕阅读器、性能基准或真实 Google 重新登录验收。原有包体积提示保留。没有未解决的本轮发布或验收问题。
