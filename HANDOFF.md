# Masuk 项目交接

## 2026-11-04 手机优先优化：QA／Android 已验收（最新）

- 用户已授权的 checkpoint／push main → QA 发布 → QA 浏览器／真实 Android 验收全部完成。最终应用冻结于 `6280ffa25a08c800b3b2cf8645f317f615fd1b7a`；QA Worker `masuk` 部署 `28bc44a5`，Ready／100%。Production 未发布，无数据库迁移或业务数据写入。
- 本轮补修两个真实验收问题：已有认可＋近期反馈组合挤出短屏首条规则；更多操作中的复制按钮继承浅色原生底。两项均已安全修复、checkpoint／push、重新构建发布与复验。前一部署 `86f94d7e`、本轮前已验收版本 `53e0df19` 保留作回滚。
- 本地最终39项浏览器检查通过。完整共享QA浏览器46项和Huawei VOG-L29／Android10／Chrome156功能验收通过；最终CSS包额外12项浏览器复验及Android最终SHA／首屏／深色按钮复验通过。最终版与完整验收版JS SHA256相同，线上4资源哈希与本地QA包匹配。
- 报告：`audits/2026-11-04-mobile-implementation/QA-ACCEPTANCE.md`；Manifest：`releases/20261104-mobile-first/manifest.json`；截图、真实配置、ZIP和原始浏览器记录均仅在忽略的本地release目录。后续文档commit不改变冻结的应用SHA，正式发布仍须单独授权。
- 浏览器及Android均恢复空搜索、全部地点、关闭菜单／表单，保留现有登录、认可、讨论与到访反馈。未创建、删除或清理业务内容。下面“准备QA发布”及“仅审计未实施”为历史记录。

## 2026-11-04 手机优先建议已实施，准备 QA 发布（最新）

- 用户已授权：Git checkpoint + push main → QA 发布 → QA 浏览器／Android 验收；未授权 Production 发布。本轮不执行数据库迁移，不重跑初始化，不改角色或现有业务数据。
- 已按手机优先审计完成首页压缩、近期反馈状态、规则／报告／讨论顺序、反馈入口、筛选数量、卡片操作层级及“我的”账号菜单。
- 本地构建、25 个首页逻辑／组件案例、4 个构建配置案例、40 组后台回归及 35 项离线 Chromium 检查通过。报告：`audits/2026-11-04-mobile-implementation/REPORT.md`。
- 以下上一轮“仅审计未实施”和冻结 SHA 记录为历史。此次必须用新的 checkpoint 构建并确认公开 build-info，再进行 QA／Android 验收，不沿用旧通过结论。

## 2026-11-04 续接入口：手机优先审计完成，仅建议、未实施（最新）

- 用户最新要求：对 https://masuk.pintumasuk.workers.dev/ 使用 Product Design 审计并给建议，不修改；随后明确“主要是要适应手机用户”。本轮审计已完成，当前请求仅补充交接记录，不自动启动下一轮开发或发布。
- 本轮报告：`audits/2026-11-04-qa-design-review/REPORT.md`；同目录含 9 张新截图与 `observations.json`，目前保留本地、未提交。以 390 × 674、390 × 844 手机视口为主，桌面 1318 × 1000 为辅助；本次未重新操作真实 Android，不能把此前真机验收当成本轮审计证据。
- P1 建议：压缩手机首屏的宣传区和单一区域选择器，将详细筛选收起；准确区分“无实测／已有实测待更多确认／已形成评分”；把近期司机报告放到当前规则旁、讨论之前，并前移“我刚去过”入口。单条报告不得自动覆盖已确认规则或提前形成评分。
- P2 建议：筛选显示结果数量，优先提供有近期反馈等有用条件；精简卡片重复未知说明，明确规则／导航主操作与编辑／复制次操作；账号入口改为可识别的“我的”并将退出放入账户菜单；补齐详情页触控尺寸和辅助文字可读性。以上均为建议，尚未实施。
- 本轮捕获时有 21 个地点，1 个地点近 30 天有反馈；待确认筛选为 21，其余五个评分等级均为 0。详情已有讨论与司机反馈是审计开始前存在的内容，不是本轮生成的数据，不得擅自删除、隐藏或清理；后续应重新读取实际状态。
- 原页面停在地点详情且反馈表单已展开，审计时保持未操作；在同一浏览器另开一个审计副本，结束后关闭副本并恢复原视口，原页面与会话保留。未输入或保存反馈、发帖、认可、举报，未修改源代码、线上数据或部署。
- 既有已验收应用仍冻结于 `343058232ccf5233aee7ae2911c5887e7fbac83d`；此前最终交接文档提交 `033dac644fc3967bac2af3a5bcbb124257f307f4` 已推送 main。QA 已发布记录为 `53e0df19`，回滚目标 `0f68edb0`；本轮仅审计，没有产生新应用版本或重新发布。后续执行发布前仍须重新核对线上目标与当前版本。
- Production 未在本轮发布。下一步应由用户决定是否实施手机优先的信息顺序“搜索 → 规则 → 近期报告 → 导航／反馈”；没有收到实施授权前继续保持只审计、不修改。若另行实施，代码变化后须重新走本地验证、checkpoint／push、QA 与真实 Android 验收，不沿用旧冻结版本的通过结论。

## 2026-11-04 首页优化：QA 浏览器与真实 Android 验收完成（已完成发布记录）

- 本轮应用 checkpoint：343058232ccf5233aee7ae2911c5887e7fbac83d，已推送 main 并核对远端一致。QA 验收后冻结同一应用 SHA；本段后续文档提交不改变已验收应用版本。
- QA Worker masuk 部署 53e0df19，Ready / 100%；发布前核实的回滚目标 0f68edb0。线上及 Android 公开 build-info 均确认上述 SHA、QA 项目 meqmyxaxnpntjlerrxcb 和共享模式。ZIP SHA256：9011517fc27cdbbe138fc85fa4af2d2e9c9e16f959e0176d0c3f31e9524ac78f。
- 发布前本地 25 项首页、40 组后台、4 项构建配置检查通过；checkpoint 后 QA 构建及预检通过，源码指纹 0c5fabca18a95e206041ef029951c663566a0f537485fb5e6852632ce48b3d71。QA 浏览器 33 项检查通过。
- 真实 Android：Huawei VOG-L29／Android 10／Chrome 156.0.8078.79。确认同一版本、真实搜索、触摸横滑、三个筛选恢复入口及全部值未变的重置边界、纯搜索空态、卡片／折叠说明、详情返回及按钮布局。最终恢复空搜索、全部筛选、关闭菜单、页面顶部。
- 真机可用高度较短，完整进门规则仍需滚动；390 × 844 模拟视口四项核心要求可见，不能推广为所有真机首屏保证。无屏幕阅读器／完整 WCAG／性能验收。
- 本轮未修改真实地点、角色、帖子、举报、反馈或认可，无新增业务测试数据；保留既有 1 人认可等资料。无数据库迁移，不重跑初始化或引导。Cloudflare 旧 connector 未使用，发布在已核对的正确浏览器账号完成。
- 完整记录：audits/2026-11-04-homepage-design/QA-ACCEPTANCE.md、releases/20261104-homepage-ui/manifest.json。截图与包只保存在忽略目录 release/20261104-homepage-ui；不提交环境、截图、凭据或构建产物。
- 用户本轮授权截至 QA 发布与验收；Production 未发布。下一步仅在单独授权后，从上述冻结应用 SHA 使用 Production 配置构建，核对 Worker my 及正式回滚点，再执行发布和最小 smoke。

## 2026-11-04 首页优化：本地通过，准备 checkpoint 与 QA 验收

- 本轮用户授权：将所有已完成修改 Git checkpoint + push main → QA 发布 → QA 浏览器／真实 Android 验收；不包含 Production 发布。
- 完成首页 8 项优化及筛选栏清除／重置自动回位：紧凑手机首屏、诚实评分、空态恢复、统一覆盖范围、进门要求优先、手机操作尺寸、菜单／筛选语义和司机可理解的资料状态。未修改数据库、角色或认证配置。
- 整体本地回归发现的唯一 P2 问题已修复，19 项针对性复验通过；原始 57/58 回归证据与关闭记录分别保留，不冒称重跑全部 58 项。见 audits/2026-11-04-homepage-design/regression/REPORT.md 及 filter-reset-fix/REPORT.md。
- 本轮发布前检查：npm run test:homepage 共 25 项通过，npm run test:admin 共 40 组通过，npm run test:build-config 共 4 项通过。社区逻辑测试已从忽略的 work 整理为 tests/community.test.mjs，首页检查可由 npm run test:homepage 复现。生成的组件测试包不提交。
- 当前尚未生成本轮 checkpoint 或发布 QA，不沿用旧应用 SHA 的验收结论。既有 QA Worker masuk／项目 meqmyxaxnpntjlerrxcb 及正式 Worker my／项目 mlpfzynzawzhrowfkqtr 继续严格分离；无数据库迁移，不重跑初始化或角色引导。
- Android 原 QA 专用 ADB 路径已安全恢复，设备在线，型号及浏览器版本待本轮核对。Cloudflare connector 仍为旧账号，停止使用该连接进行业务操作，后续仅在正确浏览器账号中核对发布目标。
- 本轮截图、真实环境文件、构建包保留本地，不提交到 Git。后续验收／部署状态写入独立 releases/20261104-homepage-ui 记录；旧发布记录仍作历史证据。

## 2026-11-04 续接入口（用户要求更新 handoff）

- **当前阶段：新版 QA 与真实 Android 已验收、测试内容已清理、应用 SHA 已冻结，等待单独的正式发布授权。** 本次请求仅更新交接记录。
- 应用冻结提交：`f6c5a54f2d16e95e044a3fe63771692c2bcbfa52`。验收报告/Manifest/部署说明的独立文档提交：`b18427a96d35099660a6f3a3b181b9134046ee46`，已推送并核对远端 `main` 一致。文档提交不能替代实际已验收的应用 SHA。
- QA 当前已验收部署 `0f68edb0`，地址 `https://masuk.pintumasuk.workers.dev/`；回滚目标 `f150c7b8`。线上 build-info 与冻结 SHA、QA 项目及共享后台标志一致。本轮测试帖/回复已隐藏且未置顶，举报 resolved、待处理 0，公开讨论 0；审计轨迹保留。
- 本轮未更新 Production。其上一已发布记录为 `339c9239` / `db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d`，目标 Worker `my`、项目 `mlpfzynzawzhrowfkqtr`、地址 `https://my.pintumasuk.workers.dev/`。这不是 Hello World 占位状态；后续操作以重新核实的当前部署为准。
- 下一次获正式发布授权后：先核对目标身份和当前部署/回滚点，再在冻结 SHA 的独立检出目录使用 Production 配置构建及预检，部署后做最小 smoke，并更新本轮 Manifest 与交接。不要直接从后续文档 HEAD 构建并标成冻结版本；无新迁移，不重跑数据库初始化或 super admin 引导。
- 续接先读本段、下方新版验收完成记录、`audits/admin-2026-11-03/QA-ACCEPTANCE.md`、`releases/20261103-admin-ui/manifest.json` 及 `DEPLOYMENT.md` 的固定发布流程。旧段落中 Git 受阻、QA 未部署、Production 占位页等均为历史状态。
- Git 与 Android 自动审批服务的前次阻断均已恢复。连接需按当时实际状态重新核对；不要沿用旧浏览器 tab ID 或假定手机仍在线。ADB 既有授权仅限 Masuk QA 操作及截图，不能自动扩大到正式环境或其他手机应用。IAB 不支持业务原生原因弹窗，QA 已在真机 Chrome 完成相关验收。
- 工作区中未跟踪的历史审计截图与 PREFLIGHT JSON 继续保留在本地；`release/`、`work/`、真实 `.env`、构建产物和依赖目录不提交。当前证据目录 `release/20261103-admin-ui/`。本次交接更新不改变任何应用源码或冻结版本。

## 2026-11-04 新版 QA 与真实 Android 验收完成（本段为当前状态）

- 应用 checkpoint `f6c5a54f2d16e95e044a3fe63771692c2bcbfa52` 已推送 main。QA Worker `masuk` 部署 `0f68edb0`；线上 build-info 再次确认该 SHA、QA 项目 `meqmyxaxnpntjlerrxcb`、共享后台开启。QA ZIP SHA256 `08cf0eda79135c526cab7c788dec53b15bcbea1c9c15aee4d1cc479e7bb9bf9c`。
- 两环境预检通过，源码指纹 `31c48e92c457c7e0078b664db77ef1602376e60de51a4e7de2449c13c75a09b2` 保持不变；源码、测试与构建配置相对应用 checkpoint 无变更。真实环境文件、构建产物和截图未提交。
- 新版桌面 QA 覆盖登录保留、紧凑页头、筛选/分页、编辑路径及返回保留、权限摘要预览、审计检索/原始值、320px 无横向溢出。真实 Android 为 Huawei VOG-L29 / Android 10 / Chrome 156.0.8078.79，覆盖模块直达、地点搜索/编辑返回、跨设备内容与置顶同步、举报、隐藏/恢复及审计卡片筛选。
- 本轮 `[QA_UI_f6c5a54]` 合成测试帖与回复已隐藏、未置顶；举报 resolved，待处理 0；最终公开详情讨论 0。原有隐藏测试内容未改动。保留本轮审计轨迹（共载入 9 条），无真实角色调整或地点资料保存。
- 上轮 Android 操作被自动审批服务用量限制中止，未绕过；用户继续后原受审路径恢复并完成验收。IAB 不支持业务原生 prompt，相关交互由已授权的 Android Chrome 完成；手机输入法曾转换举报原因中的字母数字，实际入库原因已核对，测试对象由唯一标题确认。
- **冻结应用 Release SHA 为 `f6c5a54f2d16e95e044a3fe63771692c2bcbfa52`，时间 2026-11-04 07:13（UTC+8）。** 后续交接文档提交不改变该应用 SHA；正式构建必须检出此冻结版本并使用独立 Production 配置。
- 详见 `audits/admin-2026-11-03/QA-ACCEPTANCE.md` 与 `releases/20261103-admin-ui/manifest.json`。截图仅在忽略目录 `release/20261103-admin-ui/`。
- 本轮未发布 Production。上一已发布应用记录为 `db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d` / `339c9239`，并非 Hello World；正式发布前应重新核对当前部署。下一步仅在用户单独授权后，从冻结 SHA 发布正式环境并最小 smoke。不要重跑数据库初始化或角色引导。

## 2026-11-03 Git写入已恢复，继续新版QA流程

- 用户告知“我已连接，再试一次”，重试同一范围git add成功，自动审批未再拦截。已核对暂存内容，仅为本次源码、测试、示例配置、说明及Manifest；无实际.env、截图、构建产物或依赖目录，真实公开客户端配置值未进入暂存。
- main仍以593646f为基准；接下来提交并推送checkpoint，再从该SHA重建QA、检查产物后发布，继续新版浏览器与Android验收。下文Git只读受阻记录保留为历史，不再作为当前阻断。
- 当前阶段不发布Production，不重复执行数据库初始化或角色引导。

## 2026-11-03 新版QA暂停于Git checkpoint：配置/测试完成，平台权限未解除

- 两环境配置、构建/产物校验、40组后台测试与4组构建配置检查已完成；直接调用真实Vite构建的负例也确认：关闭共享模式或将QA项目注入production都会在输出前失败。说明见`audits/admin-2026-11-03/CONFIG-CORRECTION.md`。
- git add仅准备本轮源码、测试、示例配置、说明与Manifest，明确排除实际环境、截图、构建产物。第一次自动审批以.git只读拒绝；用户随后明确回复“允许该工作区写入Git”，同一范围重试仍被自动审批拒绝，理由是用户授权不能覆盖开发者/应用层只读限制。
- 没有再试其他Git写入、远端API提交或替代仓库来绕过拒绝；只读确认Git index仍无暂存内容，远端未被本轮更改。用户授权已收到，不需要重复问是否同意同一Git任务；需要实际解除应用层Git限制，或由用户完成提交/推送。
- 必需checkpoint未完成，因此未发布QA，未在旧版本上冒充新版浏览器/Android验收。QA仍为之前核实的f150c7b8；Production未改动。
- Android真机已确认在线：Huawei VOG-L29 / Android10，当前Chrome包版本156.0.8078.79（包信息另含预装旧版80）。仅读取设备/包版本，未操作手机内容、读取凭据或会话。新版实机验收尚未执行。
- 释放平台限制后继续：复核远端main与本地变更→checkpoint/push→从该SHA重建QA并复查→QA发布→浏览器/实机完整验收与清理→冻结。正式发布仍不在当前授权中。

## 2026-11-03 新版后台：两环境配置已纠正，准备QA/Android验收

- 用户要求纠正两环境构建配置并进行新版QA与真实Android验收，授权继续既定发布流程至QA验收；本轮不发布Production。
- GitHub connector和本机CLI已核对为rainsky191919-adcrown，仓库main仍与本地基准593646f一致。Cloudflare connector返回旧账号、Supabase connector无项目，均停止使用；同一IAB登录核实Cloudflare账号f6d7976c32c9c50a893f1688f02b2e38及Supabase组织qrzglpkkqmoertxpfazw、指定QA/正式项目与Owner。
- QA Worker masuk当前版本f150c7b8、Ready100%，域名masuk.pintumasuk.workers.dev，和既定规范一致。正式站标签保留，未发布或业务写入。
- 分别读取已核实项目页面的公开publishable key，未读取/复制任何secret key或会话。根目录`.env.production`已纠正，旧文件备份在忽略work/config-correction目录；新建独立`.env.qa`，两环境均启用VITE_SHARED_BACKEND=true，仍被Git忽略。
- config/environments.mjs固定QA/正式项目、Worker与origin；Vite构建前拒绝串环境/未启用共享/非公开密钥/多余暴露变量。输出分别为dist/qa与dist/production；公开build-info记录目标和源码SHA。预检脚本同时支持qa/production，两者初步构建/产物检查通过，源码快照一致、无交叉项目或本机夹具标记。
- 40组后台测试已整理至tests/admin-ui，jsdom30.1.3固定为开发依赖，npm run test:admin与4组构建配置边界检查通过。安装时发现既有构建依赖告警，Vite同主版本更新为8.3.5并更新兼容source-map-js后npm审计为0；全量后台回归再次通过。
- 交接记录中的QA专用ADB授权仍有效，设备DUM7N19327003924（Huawei VOG-L29）实机在线；普通进程ADB服务启动失败，经获准权限恢复。仅用于Masuk QA，不读取凭据/会话或其他手机应用数据。
- 下一步按源码checkpoint/push→从该SHA重建QA→发布QA→浏览器与真实Android验收执行。此条为发布前记录，不提前宣称QA/Android通过。

## 2026-11-03 后台10项整体验收：本地通过，上线前检查未通过（未发布）

- 用户要求“整体验收与上线前检查”，本轮未执行提交/推送、QA或正式发布。完整报告：`audits/admin-2026-11-03/ACCEPTANCE.md`；本地配置/产物诊断：`PREFLIGHT.json`。
- 补齐原审计遗漏：后台编辑移除前台宣传区，增加后台/地点管理/编辑地点路径、地点H1与当前版本，压缩管理说明；路径按钮复用取消返回。后台增加上次成功载入时间（UTC+8），失败刷新不会更新时间。
- 修复320px有竖向滚动条时15px横向溢出：仅后台首页/后台编辑解除body固定最小宽度。按实际clientWidth305/375/1265px复验320/390/1280px窗口，管理记录页及编辑页scrollWidth均相等；此前仅比较innerWidth的结论以此次为准。
- 最终40组后台模拟检查、既有4项社区逻辑检查、生产构建及差异空白检查通过。隔离本机Postgres基线覆盖权限/共享内容/冲突/审核/审计，通过并清理临时容器。普通Docker接口权限问题通过获准本机执行后恢复，未接触云端库。
- IAB本机连续管理/编辑返回、权限预览草稿、日志搜索/原始值、实际Leaflet地图及按钮/字号检查通过，error日志0。无真实写入或权限调整；已重置窗口尺寸、关闭本轮预览及服务，原正式标签未操作。截图以acceptance-前缀保存在同一审计目录。
- **上线阻断项**：根目录`.env.production`为遗留QA配置，且共享后台未开启。默认构建含QA项目、不含正式项目，不能发布到Worker my。没有覆盖环境文件或复制公开/私有密钥来绕过核对。
- 新增 `scripts/check-release-preflight.mjs`，只读本地配置/产物并记录指纹，错误配置以非零状态退出；最终诊断正常拒绝放行。DEPLOYMENT.md顶部已添加明确说明，旧版本released Manifest未被改写。
- 当前源码尚未提交；模拟夹具在忽略的work目录并依赖其jsdom，需正式整理可复现测试交接。新版QA浏览器、真实Android、冻结SHA及正式最小smoke均未执行，旧记录不替代新版验收。
- 下一步：先分别纠正/核对QA与正式构建配置，再按既定流程完成源码checkpoint、QA/Android验收、冻结与独立授权发布。当前不得直接上传默认dist。

## 2026-11-03 后台体验优化第10步：空状态说明与模块命名（本地完成，未发布）

- 用户要求先完成第10项，再告知下一步。云端后台“跨设备内容管理”改为“讨论内容管理”，桌面模块直达名称及完整可访问名称同步更新，手机短标签仍为“内容”；原模块ID、焦点定位及权限条件不变。
- 举报按待处理/已处理/已驳回/全部分别显示明确的无记录标题与后续操作说明；说明限定于本次载入结果，不宣称后台永远没有举报或所有任务已处理。无待处理项目与完全没有举报历史保持区分，切换筛选继续使用原控件。
- 讨论模块明确管理帖子、回复和到访反馈；空状态只在三类内容均为空时显示。修复已有到访反馈但无帖子/回复时仍显示“暂无云端讨论内容”的误报；隐藏的反馈同样算已有内容，保留恢复入口。原隐藏/恢复、置顶、举报处理回调及接口不变。
- 空状态继承后台深色面板与13px辅助文字，使用状态语义。载入中及载入失败沿用现有真实状态，不出现“无内容”的成功假象；未增加自动刷新、写入或发布行为。
- 生产构建、差异空白检查通过，仅既有包体积提示。新增4组只读模拟检查通过：四种筛选/讨论说明、已有历史但无待办、仅帖子/仅回复/仅隐藏反馈、载入中/失败/刷新恢复。现有编辑返回4组及云端导航3组回归通过，共11组。本机夹具首次测试因导入路径导致模拟后端被打包两份，统一夹具导入后通过；无需更改产品逻辑绕过测试。
- IAB本机虚构空数据验证四种举报状态文本；1280×900、390×844和320×844无横向溢出。320px键盘Enter直达讨论模块后焦点在admin-content，标题top约90px、固定导航bottom74px，未被遮挡。未对线上空数据作推断，未提交任何真实业务操作。
- 截图：`audits/admin-2026-11-03/step10-desktop-empty.png`、`step10-mobile-empty.png`。临时窗口尺寸已重置，本轮预览标签及本机服务完成后关闭，原线上标签保持未操作。
- 未提交/推送Git，未发布QA/Production，未改数据库、真实内容、角色或鉴权。原审计10项的本地修改现已完成，线上尚未更新；模拟验证不等于真实云端写入、Android实机或完整可访问性验收。
- 下一步建议：对这10项做整体验收及上线前检查，按既定环境流程准备发布；发布和真实业务写入仍须遵守单独授权边界。

## 2026-11-03 后台体验优化第9步：统一控件与文字可读性（本地完成，未发布）

- 用户要求先完成第9项，再告知下一步。后台输入框、下拉框和文本域统一深色底、7px圆角与清晰边框，普通控件至少44px高，桌面14px、窄屏16px；举报状态不再使用白底原生外观。处理说明和编辑文本域至少96px高。
- 地点名称14px、区域/版本/状态12px，后台标签和辅助说明13px；后台编辑保存说明由9px提高至13px，统一占位文字颜色与不透明度。新增仅管理员编辑使用的作用域类，公开投稿表单样式保持原样。
- 后台按钮、输入框、下拉框、文本域及记录展开入口补齐2px荧光绿键盘焦点。举报隐藏复选框为20px，关联文字点击区域至少44px，避免原表单通用宽度使其被拉伸；保留编辑/复核、警告和禁用状态的颜色含义。后台编辑的地图周边按钮/帮助文字亦统一尺寸，未更改地图本身。
- 生产构建与差异空白检查通过，仅既有包体积提示。现有编辑返回4组、云端/本机文案各3组，共10组模拟回归通过；未为样式修改新增重复实现的测试。
- IAB本机只读模拟后台使用1条虚构举报检查有内容的举报筛选、结论、复选框及说明表单；未提交处理、隐藏、复核或权限变更。桌面1280×900、390×844、320×844无横向溢出，320px后台可见按钮/输入/下拉框均至少44px。修复实测发现的文本域最小高度被通用控件规则覆盖问题后继续检查，最终96px生效。
- 从浏览器实际计算色取样：占位文字#9aa9bb/输入背景#0e1723为7.52:1；辅助文字#b8c4d3/后台面板#121b28为9.79:1；边框#5a7088/输入背景为3.52:1。仅代表这些取样，不是完整WCAG合规认证；编辑面板有透明背景，未将上述面板数值套用到所有页面。
- 键盘验证举报筛选、编辑输入/下拉框及取消按钮均显示2px焦点；取消编辑返回原Iconia地点操作按钮。确认公开投稿表单未获得管理员样式。地图在本机夹具中被替换为空组件，未做地图控件运行验证；未做Android实机、完整读屏或真实云端写入验证。
- 截图：`audits/admin-2026-11-03/step9-desktop-controls.png`、`step9-mobile-controls.png`、`step9-mobile-edit.png`。临时窗口尺寸已重置，本轮预览标签及本机服务完成后关闭，原线上标签保持未操作。
- 未提交/推送Git，未发布QA/Production，未修改真实数据库、角色、接口或鉴权。线上仍未更新。
- 下一步建议：第10项，完善举报与讨论内容的空状态说明，将“跨设备内容管理”改为更易理解的“讨论内容管理”。

## 2026-11-03 后台体验优化第8步：可读操作记录与筛选（本地完成，未发布）

- 用户要求先完成第8项，再告知下一步。新增 `AdminAuditLog.jsx`，替换云端后台原有单行拼接日志；按时间/操作者/对象/动作/原因五列展示，手机转为带字段标签的卡片。本机“最近修改”仍为原5条资料摘要，未将其冒充完整审计历史。
- 动作代码映射为中文；复核、置顶、可见性、角色调整、举报结论等已知机器标记显示可读说明。仅从当前已载入资料映射地点名称、账号邮箱、当前账号及已知内容；未知编号保持可查的缩略标识，空操作者只在初始化动作中标为系统初始化，其余为未记录，未知动作保留原代码。
- 每条可展开原始记录，保留完整记录编号、原始时间、动作代码、操作者/对象编号及原始原因。没有修改、补写或删除日志。
- 搜索覆盖可读名称和原始编号/内容，可结合动作及起止日期筛选；时间按Asia/Kuala_Lumpur、UTC+8展示和筛选，起止日期含当日。倒置日期明确报错。每页10条，筛选回到首页、数据缩减时收回有效页码。明确仅筛选当前已载入的最近记录（服务端最多100条），不宣称搜索完整历史。
- 最终生产构建通过，仅既有包体积提示。新增5组模拟检查通过：列/排序/时区/范围、名称与编号搜索及未知值、动作与原因翻译/空结果、跨UTC午夜日期/倒置/坏时间、分页/刷新/空数据/源记录不变；现有云端导航3组、编辑返回4组及云端文案3组回归亦通过。测试夹具只读，材料在忽略目录 `work/edit-return/`。
- IAB使用12条虚构日志实测：名称搜索、动作筛选、同日筛选8条（含UTC前一天16:15→本地00:15）、日期错误提示、10+2分页、键盘展开完整原始标识均通过。日期控件直接fill未输入成功，改用控件键盘分段输入后验证通过，未为工具限制修改日期功能。
- 390/320像素卡片无横向溢出，展开长编号仍可换行；窄屏保留table和5个列标题语义，固定导航不遮挡模块标题。这不等于完整读屏/WCAG或Android实机验收。
- 截图：`audits/admin-2026-11-03/step8-desktop-audit.png`、`step8-mobile-audit.png`。临时窗口尺寸已重置，本轮预览标签及本机服务在验证后关闭。
- 未读取或写入线上日志，未改数据库/角色/鉴权；未提交/推送Git、未发布QA/Production。线上仍未更新，后续发布须遵守既定流程与授权边界。
- 下一步建议：第9项，统一后台控件样式，改善辅助文字、输入提示的字号与对比度。

## 2026-11-03 后台体验优化第7步：地点操作层级与对象名称（本地完成，未发布）

- 用户要求先完成第7项，再告知下一步。新增共享 `AdminLocationActions.jsx`，云端/本机后台统一：修改资料作为主操作（荧光绿文字与浅底），复核作为次级操作，需复核时使用橙色状态；本机原有删除保持低强调，未增加云端删除入口。
- 每行操作分组及每个按钮的完整可访问名称/提示均包含地点名称。复核按钮按状态显示“标记复核”或“取消复核”，并通过 `aria-pressed` 呈现标记状态；图标不重复参与名称。云端“正常”明确标为“管理状态：正常”，避免与门禁实测结果混淆。
- 所有按钮最小高度44px，窄屏可换行且保持编辑在前；未改变编辑、复核、删除的业务回调、确认或接口。清理了本机后台不再使用的Trash2导入。
- 生产构建通过，仍只有既有包体积提示。4组新增操作检查通过：按地点命名/编辑目标、复核状态与目标、忙碌禁用/本机可选删除回调、本机App复核标记与筛选联动；第1步4组返回回归及第2步6组云端/本机文案回归仍通过。测试仅模拟回调或本地内存状态，无网络或数据库写入，材料在忽略目录 `work/edit-return/`。
- IAB本地只读模拟后端确认桌面主次样式和每行名称；键盘Tab从Iconia编辑移至其复核按钮，Enter从指定名称进入Iconia编辑页，取消后焦点回到对应按钮。390/320像素无横向溢出，按钮高44px；320宽度下每个约100px，当前页20个操作名称均可区分。未点击云端复核或保存，未执行删除；未做Android实机或真实云端写入验收。
- 截图：`audits/admin-2026-11-03/step7-desktop-actions.png`、`step7-mobile-actions.png`。临时窗口尺寸已重置，本轮预览标签及本机服务在验证后关闭。
- 未提交/推送Git、未发布QA/Production、未修改数据库或角色。线上仍未更新，后续发布继续遵守既定流程与授权边界。
- 下一步建议：第8项，将操作记录按时间、操作者、对象、动作、原因清楚展示，并加入检索筛选。

## 2026-11-03 后台体验优化第6步：权限调整核对与确认摘要（本地完成，未发布）

- 用户要求先完成第6项，再告知下一步。新增 `AdminAccountRoles.jsx`：从已有管理账号选择或手填邮箱，显示当前角色、目标角色及影响范围，先“核对权限调整”生成摘要，再由独立“确认提交权限调整”按钮调用原 `set_role` 接口；移除旧原生confirm简单提示。
- 未列入角色列表的邮箱明确显示“未列入管理账号（验证状态待确认）”，不假定为已验证普通用户；当前角色注明以上次后台刷新为准。相同角色无需重复提交，已知最后一位Super admin不能降级，调整当前使用账号时显示影响说明；后端原有验证与最后一位保护不变。
- 摘要固定包含邮箱、当前/目标角色、影响、原因。修改任一输入或刷新后的角色资料发生变化，会使旧摘要失效；提交使用摘要中已核对的规范化邮箱/角色/原因，使用进行中锁防重复。失败保留草稿及可恢复错误，未知结果不宣称“肯定未保存”。请求已成功但后续刷新失败会明确提示已保存、需刷新核对。
- 核对后焦点移至摘要，避让固定导航；返回修改聚焦并居中显示邮箱，保留草稿。现有模块直达、筛选和编辑返回行为保持。
- 最终生产构建通过，仅既有包体积提示。7组新增组件模拟检查通过：选择/同角色/预览不提交、字段失效与未知账号、规范化载荷/防重/成功、最后一位与自身影响、拒绝保留草稿、角色刷新/忙碌状态、未知结果。最终确认仅调用测试桩，无网络或数据库写入。现有云端模块导航3组、编辑返回4组、云端文案3组回归亦通过；夹具在忽略目录 `work/edit-return/`。
- IAB使用本地只读模拟后端和三个虚构管理账号：选择 `moderator@example.test`，预览管理员→Super admin及测试原因，核对摘要、返回焦点和编辑失效。390/320像素无横向溢出、操作按钮高44px，摘要不被固定导航覆盖；未列入邮箱状态正确。浏览器从未点击最终确认，模拟后端仍拒绝所有写命令。未修改任何真实角色，未实测真实云端写入或Android设备。
- 截图：`audits/admin-2026-11-03/step6-role-confirm-desktop.png`、`step6-role-confirm-mobile.png`。临时窗口尺寸已重置；本轮预览标签和本机服务完成后关闭。
- 未提交/推送Git、未发布QA/Production、未修改数据库或鉴权策略。线上仍未更新，后续发布继续遵守既定流程与授权边界。
- 下一步建议：第7项，优化地点行操作的主次及可访问名称，让修改与复核按钮明确对应地点。

## 2026-11-03 后台体验优化第5步：模块直达导航（本地完成，未发布）

- 用户要求先完成第5项，再告知下一步。新增 `AdminSectionNav.jsx` 页内直达导航：云端有举报/内容/地点/管理员账号/操作记录；管理员账号入口随原有 super admin 可见条件显示，普通管理员只有4项，未改变鉴权或权限。本机只显示地点资料/最近修改2项。
- 导航在页面滚动时固定顶部，窄屏使用短标签且保留完整可访问名称。各按钮至少44px高，通过 `aria-controls` 指向已有模块标题；点击或键盘激活后聚焦并滚动至对应标题，不更新URL/hash，不卸载模块、不提交表单。
- 通过导航高度测量设置滚动避让距离，标题及地点分页回顶不被固定导航遮挡。后台根容器使用 `overflow: clip`，确保固定定位随文档滚动工作；前台及编辑页面保留既有容器行为。
- 生产构建通过，仅既有包体积提示。新增5组导航检查通过：云端/本机目标和焦点、搜索/筛选/页码/未提交草稿保留、不同客户端角色的入口可见性；既有第1步4组返回回归和第2步6组文案回归仍通过。验证夹具在忽略目录 `work/edit-return/`，不连接远端数据。
- IAB只读模拟后端实测：1280×900桌面5个入口都定位正确，固定导航top12px，标题在导航下方且URL/hash不变；键盘Enter激活账号模块后Tab进入邮箱输入框。仅在本地输入了虚构邮箱及未提交测试原因，跨模块后草稿、地点搜索/区域/状态和第2页保持，未点击任何保存按钮。
- 390和320像素窄屏无横向溢出，导航按钮高44px、320宽度下每项约48px，模块标题不被遮挡。未进行真实云端写入或Android实机验收；临时窗口尺寸已重置。
- 截图：`audits/admin-2026-11-03/step5-desktop-nav.png`、`step5-mobile-nav.png`。本轮临时预览标签和本机服务在验证后关闭。
- 未提交/推送Git、未发布QA/Production、未更改云端数据库或角色。后续发布继续遵守既定流程与授权边界。
- 下一步建议：第6项，优化管理员权限调整的核对信息，展示当前角色→目标角色及提交前确认摘要；不默认执行真实账号权限变更。

## 2026-11-03 后台体验优化第4步：紧凑后台首屏（本地完成，未发布）

- 用户要求先完成第4项，再告知下一步。后台首页移除前台宣传区、收紧主内容顶部留白，直接显示后台页头；切回前台时宣传与原间距正常恢复。后台编辑页面仍沿用第2步的编辑身份/保存说明，本轮没有重做编辑表单。
- 云端和本机后台统一为单行主标题H1，尺寸28–36px；后台模块标题调整为H2，保留原视觉字号，形成连续标题层级。本机后台移除原页头大标语。
- 云端刷新按钮改为右侧独立次级按钮，宽度约105px、最小高度44px；窄屏按空间自然换行。请求中显示“刷新中…”并禁用按钮，避免重复点击。统计卡自动均分桌面宽度；手机两列排列，第三张卡跨列。
- 最终生产构建通过，仍仅有既有包体积提示；第1步4组返回/筛选/页码回归和第2步6组云端/本机文案回归全部通过。
- IAB只读模拟后端实测：桌面主标题36px、单行且仅1个H1；不再渲染前台宣传区，刷新按钮非全宽。刷新后举报筛选和地点搜索保持，按钮恢复可用。390和320像素下标题28px单行，刷新点击高度44px、无横向溢出；返回前台后宣传区恢复。未进行Android实机或真实云端写入验收。
- 本地截图：`audits/admin-2026-11-03/step4-desktop-overview.png`、`step4-mobile-overview.png`。临时窗口尺寸已重置，本轮创建的预览标签及预览服务在验证后关闭。
- 未提交/推送Git、未发布QA/Production、未更改数据库或角色。线上仍为原已发布版本，后续发布继续遵守固定流程与授权边界。
- 下一步建议：第5项，添加后台模块直达导航，方便切换举报、内容、地点、管理员和操作记录，减少滚动查找。

## 2026-11-03 后台体验优化第3步：地点搜索、筛选与分页（本地完成，未发布）

- 用户要求先完成第3项，再告知下一步。本轮新增 `AdminLocationList.jsx`，云端和本机后台共用；保留各自原有编辑、复核及本机删除操作，不改变写入接口和权限。
- 搜索覆盖地点名称、区域和地址，忽略大小写与首尾空格；可组合地点区域及复核状态（全部/需复核/正常）。提供匹配数、当前显示范围、清空筛选及空结果提示。
- 默认每页10条；改变搜索/筛选回到第1页，实时数据缩减时自动收回有效页码；翻页后回到地点列表顶部。取消编辑保留搜索、区域、复核状态、页码、焦点和原滚动位置。
- 生产构建通过，只有既有包体积提示。4组新增列表回归覆盖27条数据10/10/7分页、边界、名称/区域/地址搜索、组合筛选、空结果、清空、数据缩减/区域消失及空数据；第1步4组返回回归（新增页码/搜索/区域/状态保持断言）及第2步6组文案回归均通过。材料在忽略目录 `work/edit-return/`。
- IAB本地只读模拟后端实测通过：21条分页为3页、搜索及组合筛选/清空、末页仅1条且下一页禁用；第2页编辑取消后搜索 `Skudai`、区域 `Skudai, Johor`、状态 `normal`、页码2/3及滚动位置957均恢复。最初前后滚动对比差异来自定位器点击前自动滚动；改用当前可见按钮确认实际来源位置精确恢复，未修改代码来迎合测试。
- 桌面及390/320像素窄屏检查通过，未发现横向溢出；不等于Android实机验收。截图：`audits/admin-2026-11-03/step3-desktop-list.png`、`step3-mobile-list.png`。验证无真实云端登录或写入，所有模拟写命令拒绝。
- 未提交/推送Git、未发布QA/Production、未修改云端数据库或角色。本轮临时标签和本机预览完成后关闭。模块直达尚未实现；既有发布流程仍须遵守。
- 下一步建议：第4项，精简后台首屏，修正大标题换行与刷新按钮比例。

## 2026-11-03 后台体验优化第2步：保存范围与编辑身份说明（本地完成，未发布）

- 用户要求仅完成第2项，再告知下一步。本轮按 `sharedBackend` 的实际写入分支区分保存说明：云端保存成功后更新当前站点、供其他设备读取；本机保存仅影响此浏览器，不上传或同步。
- 新建、普通编辑、后台编辑各自显示合适文案。编辑不再宣称“先标为司机补充”；后台编辑显示目标地点与管理员编辑身份，并保持后台导航选中。原有必填修改原因、版本冲突处理和保存路径保留。
- 成功提示区分“已保存到云端”与“已保存到此浏览器”；云端后台的总说明同步更新。未改变数据库结构、鉴权或写入权限。
- `npm run build` 通过，只有既有包体积提示；6组组件文案场景（云端/本机 × 新建/普通编辑/后台编辑）通过；第1步4组返回流程回归仍通过。验证材料在被忽略的 `work/edit-return/`，不连接远端数据。
- 已恢复IAB本地预览连接：先启动可访问的本机服务，再在同一IAB新开准确本地网址，确认标题 `LOCAL ONLY · Edit return verification`、origin `http://127.0.0.1:5186`。使用专用本地模拟身份和只读模拟后端，所有写命令被拒绝，地图在验证夹具中被替换；未使用真实云端认证或数据。
- 浏览器确认：后台编辑显示正确地点/身份/云端保存文案；重复编辑取消后举报筛选 `dismissed`、滚动位置 `1313` 和“修改资料”按钮焦点均保持。第1步此前未完成的桌面浏览器返回路径检查现已补上；不能称为真实云端写入、完整浏览器回归或Android验收。
- 本地浏览器截图：`audits/admin-2026-11-03/step2-cloud-edit.png`。未点击保存、未提交云端数据，未提交/推送Git或发布QA/Production；线上仍未更新。本轮临时预览完成后关闭。
- 下一步：第3项，优化后台地点检索（搜索、区域/状态筛选和分页），再处理模块直达。

## 2026-11-03 后台体验优化第1步：取消编辑返回来源（本地完成，未发布）

- 用户采纳本轮 Product Design 审计建议，要求先完成第1项，再告知下一步；本轮范围为编辑返回路径，尚未启动保存说明或地点检索优化。
- `src/App.jsx` 记录编辑来源页面、滚动位置及触发按钮。取消编辑后恢复来源；后台编辑期间保留后台组件实例，恢复举报筛选及按钮焦点。若编辑中退出登录或失去管理角色，取消时安全返回前台。
- 从前台列表和地点详情进入编辑也恢复各自来源及位置。保存行为未调整。
- `npm run build` 通过；仅已有大体积包提示。隔离组件回归4组通过：后台重复编辑取消保留实例/举报筛选/位置/焦点、前台来源、详情来源、编辑中退出登录。使用临时DOM和模拟只读后端，网络请求禁止；验证材料在被忽略的 `work/edit-return/`。
- 浏览器实测未完成：本地预览HTTP 200，但IAB首次超时后的错误标签被工具URL策略阻止接管；已停止受影响操作，未切换浏览器/连接或发布到云端以替代本地验证。不能把组件回归称为浏览器/Android验收。
- 未提交/推送Git、未发布QA/Production、未修改云端数据/权限。线上仍为此前已发布版本。后续发布仍须遵守固定发布流程及现有授权边界。
- 下一步建议：第2项，按真实运行模式统一云端/本地保存说明与管理员编辑文案。

## 2026-11-03 管理与共享后台已发布完成（最终最新状态）

- 发布严格按 Local 开发/完整验证 → HANDOFF → Git checkpoint + push main → QA 发布 → 浏览器与真实 Android 验收 → 冻结 SHA → Production → 最小 smoke → 交接/Manifest 执行。
- 应用 Release SHA：`db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d`。之后 main 上的提交仅更新交接/Release Manifest，不改变该已验收应用源码。QA 部署 `f150c7b8`；Production 部署 `339c9239`，Ready、100%。
- QA：https://masuk.pintumasuk.workers.dev/ → Supabase `meqmyxaxnpntjlerrxcb`；正式版：https://my.pintumasuk.workers.dev/ → Supabase `mlpfzynzawzhrowfkqtr`。两环境的数据库/认证/浏览器存储隔离。
- `rainsky191919@gmail.com` 已在两环境的真实已验证账号中分别授予 super admin，均有操作时明确确认。QA UUID `5e8fe33b-376c-4a4b-985e-0c69c409782f`；Production UUID `df4d6c93-2bfe-44d5-81b0-ce9aa54fa7f9`。服务端角色表是授权依据，不是邮箱/显示名或 user_metadata。
- Production 初始化已执行：21 条公开种子、21 个历史第一版、全部表 RLS 启用；帖子/回复/举报/反馈均为 0，未导入 QA 测试内容或用户。不要重复执行 initial_deployment.sql 或本次增量迁移。
- 用户已亲自完成 Production Google OAuth 凭据配置；真实登录返回 `my.pintumasuk.workers.dev` 成功，后台显示 Super admin 和指定邮箱，刷新可恢复会话。正式版 Site URL/精确允许回跳均已设为正式网址。
- 共享帖子、回复、帮助标记、到访反馈、地点共同编辑、版本历史和版本认可现已使用服务端 RPC；跨设备在写入后、窗口聚焦及每 15 秒刷新。旧本机内容不会自动上传，仍保留。此前“这些功能仅本机”的历史描述已过时。
- 管理后台支持地点复核/修改、帖子置顶、帖子/回复/反馈隐藏与恢复、举报接收/处理/驳回及服务端审计；super admin 可按已验证邮箱分配/撤销管理员权限，禁止降级最后一位 super admin。
- QA 实测闭环：桌面真实发帖/回复/帮助，Android 10 Huawei VOG-L29 读取同一内容并举报，桌面审核隐藏，手机后台隐藏回复后桌面同步。测试帖/回复已隐藏，公开列表恢复为空，历史审计保留。
- Production smoke 通过：主页/21 地点/详情/独立数据库/Google 登录/真实 super admin 后台/刷新恢复/表 RLS 与角色及举报直接访问限制。正式版未执行社区写入测试，遵守最小 smoke 范围。
- Security Advisor：0 errors；收紧了控制台自动生成的 `public.rls_auto_enable()` 对 public/anon/authenticated 的 EXECUTE（事件触发器保持启用），两项函数权限警告已消失。剩余 1 项平台警告为 Leaked Password Protection Disabled；本站前端使用 Google OAuth，不使用密码登录；9 项私有表无策略提示对应“无直接客户端访问，仅经授权 RPC”的设计，不能为了消提示开放表策略。
- 构建包 SHA256：QA `c9cd041ad3962ac3f6c4abb92eb180aae9b3baad22bf83b35ec0d6a303f46220`；Production `3f41baa141976e4ab7eae6054b5411db7ebdf8ee26b49ede42c5163d24169cc6`。Production 从冻结 git archive 独立构建，环境配置仅 URL 与公开 publishable key，不含服务端密钥。
- 证据目录 `release/20261103-admin-community/`；重点 `production-deployment-ready.png`、`production-db-smoke.png`、`production-owner-login.png`、`production-super-admin-dashboard.png`、`production-security-advisor.png` 及 Android/QA 截图。不得上传实际环境文件/截图到仓库。
- 本次明确创建的 `masuk-admin-*` 测试容器和网络已清理；本机预览进程检查未发现仍运行实例；手机临时 `/sdcard/masuk-qa-screen.png` 与 `masuk-qa-ui.xml` 已删除，项目内证据保留。
- 回滚：Cloudflare 前端可回滚至 QA 前版 `dd999a07`、Production 前版占位 `737dcad3`。数据库为增量结构，回滚前端不应自动删除历史、用户内容或角色；当前新结构兼容旧公开 locations 读取。

## 2026-11-03 QA 实机验收通过、Release SHA 已冻结（最新）

- 已通过真实 Huawei VOG-L29 / Android 10 的 Google owner 登录、读取桌面测试帖/回复、提交举报、进入 Super admin 后台并隐藏测试回复；桌面收到手机举报并处理，同时手机/桌面双向同步清理状态。QA 测试帖和回复均已隐藏，审计保留，未修改真实地点资料。
- QA 浏览器与 Android 验收通过，冻结应用 Release SHA `db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d`；后续独立交接/Manifest 文档提交不替换此应用 SHA。QA 部署仍为 `f150c7b8`。
- 证据补充：`android-cross-device-post.png`、`android-admin.png`、`android-cleanup.png`、`qa-resolved-report.png`、`qa-report-resolved-cleanup.png`，位于本次 release 证据目录（不上传仓库）。
- 下一步检查独立 Production 配置并使用同一冻结 SHA 发布；截至本段记录尚未修改 Production，仍为 Hello World。生产 Google OAuth secret 只能由用户直接填写，不从 QA 读取/复制机密；Production super admin 引导仍须已有该邮箱的真实已验证账号。

## 2026-11-03 QA 已发布，Android 验收进行中（最新状态）

- 本地验证后已推送 checkpoint `db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d` 到 `main`，本地和远端 SHA 一致；尚未冻结 Release SHA。
- 用户已在操作时明确确认 QA 增量迁移与 super admin 授权，已执行并核验 `rainsky191919@gmail.com` -> `super_admin`（QA 用户 UUID 同下文）。原 21 地点保留，21 个历史初始版本，全部私有表 RLS 开启，authenticated 无角色 INSERT，anon 无举报 SELECT。
- QA Worker `masuk` 部署 `f150c7b8`，Ready、100%；构建包 SHA256 `c9cd041ad3962ac3f6c4abb92eb180aae9b3baad22bf83b35ec0d6a303f46220`，来源 checkpoint 同上。
- QA Site URL 已更新为 `https://masuk.pintumasuk.workers.dev`，已添加精确回跳 `https://masuk.pintumasuk.workers.dev/`，旧回跳暂保留。真实 Google `rainsky191919@gmail.com` 登录成功，后台显示 skyy skyy · Super admin，管理员角色列表与审计记录正常。
- Android 已重新连接：Huawei VOG-L29 / Android 10；用户明确允许使用 ADB 只操作 Masuk QA 页面并保存截图。已验证手机加载 21 云端地点、正常跳 Google 选择页；手机缺少指定管理员的登录，已请用户在手机自行完成 `rainsky191919@gmail.com` 安全登录。不得读取凭据/会话。
- 已在 Bukit Impian Residence 发布明确标识的测试帖 `[QA 验收 20261103] 跨设备与举报测试`，用于跨设备验收，验收后须隐藏本帖及测试回复。不得把测试内容迁移 Production。
- 当前待办：手机登录后继续 Android 管理/回复/举报及桌面审核闭环，完成清理和证据；QA 全部通过后冻结 SHA，才可进入 Production。Production 尚未改动，仍为 Hello World。
- 证据：`release/20261103-admin-community/` 中 `qa-super-admin-granted.png`、`qa-db-verification.png`、`qa-deployment-ready.png`、`qa-auth-urls.png`、`qa-super-admin-dashboard.png`、`android-home.png`。截图与真实环境配置不得上传仓库。

## 2026-11-03 管理与共享后台开发中（最新任务）

- 用户授权按顺序实现正式管理员、服务端权限、跨设备内容管理、举报处理，并指定 `rainsky191919@gmail.com` 为初始 super admin；后续仍严格遵守下方固定发布流程。
- GitHub 插件和本机 CLI 均已核验为 `rainsky191919-adcrown`，仓库 ADMIN 权限；已克隆并恢复本目录 Git 历史，基线 `b496cf672f9ba489a60ee84718b54ec061dc3ec3`，源码未被覆盖。下文“不是 Git checkout”已过时。
- QA 只读核验：现有 public 只有 locations、RLS 开启；目标邮箱对应已验证非匿名用户 `5e8fe33b-376c-4a4b-985e-0c69c409782f`。尚未在云端授予管理员。
- 新迁移 `supabase/migrations/20261103042312_shared_admin_community.sql` 为增量迁移，不重建 locations。私有角色、讨论/回复、反馈、举报、历史版本/认可和审计表全部启用 RLS、撤销浏览器直接读写，只经校验身份/所有权/数据库角色的 RPC 操作。
- `supabase/bootstrap_super_admin.sql` 是环境独立引导脚本：只匹配已有且已验证的指定邮箱；缺失则失败，不创建假账号、不使用 user_metadata 授权。Production 尚无已核验账号，不能假定 QA UUID 在 Production 相同。
- 新前端通过 `VITE_SHARED_BACKEND=true` 显式启用云端。启用后不读取、上传或删除旧本机社区/地点数据，不在云端失败时降级为本机写入。跨设备按 15 秒与窗口聚焦刷新；不是 Realtime 推送。
- `src/components/CloudAdmin.jsx` 提供角色管理、地点复核/编辑、内容隐藏/恢复、举报处理及审计。普通管理员不能授予角色；保留最后一位 super admin。帖子、回复、反馈隐藏可恢复，隐藏反馈不参与公开友好度。
- 本地验证已通过：`npm run test:db` 全新无网络 PostgreSQL 权限/所有权/冲突/举报/审计测试；`tests/shared_ui_smoke.py` 用真实本地 PostgREST、隔离账号与两个浏览器上下文验证共享/举报处理/320-1440 布局；旧 community 和 accuracy smoke 均通过（accuracy 旧登录提示断言已按现有提示执行适配）。构建此前通过，发布配置构建需记录最新证据。
- 已连接真实 Android：Huawei VOG-L29，ADB serial `DUM7N19327003924`；用户指定使用此设备验收。尚未执行 QA Android 验收。
- 当前临时本地进程：共享开发 5173、本机演示 5174、本地测试代理 55432、PostgREST 55431；测试容器与网络均以 `masuk-admin-` 开头，仅清理本任务明确创建的实例，勿清理其他 Docker 项目。
- **截至本段记录：尚未 push 本次 checkpoint、发布 QA、冻结 Release SHA 或发布 Production；super admin 云端授予尚未执行。不得宣称上线完成。**

## 固定发布流程（用户于 2026-11-03 指定，后续发布必须遵守）

Local 开发 → Local 完整验证 → 更新 HANDOFF → Git checkpoint + push `main` → QA 发布 → QA 浏览器/Android 验收 → 冻结 Release SHA → Production 发布 → Production 最小 smoke → 更新 HANDOFF / Release Manifest

- 具体阶段要求与 Release Manifest 字段见 `DEPLOYMENT.md` 的“固定发布流程”。不得跳过、颠倒或将未执行的验收标为通过。
- QA 与 Production 使用同一个已冻结源码 SHA；环境配置分别构建并记录，不得将 QA 配置或数据直接搬入正式版。冻结后改代码必须重新走验证和 QA 验收。
- Android 验收须记录实际设备/系统/浏览器；桌面手机尺寸模拟不能冒充 Android 实测。缺少设备或连接时记录未完成并停在该发布关口，继续独立工作。
- 当前目录尚非 Git checkout；下一次发布前须安全恢复到已核实私有仓库的工作副本、保留本地变更，再完成 checkpoint 与 push `main`，不得绕过此步骤直接上传发布。
- 该流程规定发布顺序；具体发布范围沿用当前任务授权，平台审批和已有安全边界继续有效。当前消息仅持久化流程，不触发一次发布。

## 2026-11-03 正式版域名已建立（本段优先于下文 pending 状态）

- 用户在明确说明 Hello World 占位页发布及审批拒绝原因后，回复“允许”，明确批准该占位发布。
- 已在核实的 Cloudflare 账号创建独立 Worker `my`，网址 https://my.pintumasuk.workers.dev/ 。部署版本 `737dcad3`，页面显示 Ready、100%；真实访问返回 `Hello World!`。
- QA Worker `masuk` 保留，网址 https://masuk.pintumasuk.workers.dev/ 。两个环境的 Worker 和网址已分开。
- 正式版目前只有已获批准的占位页，没有 Masuk 应用源码、Supabase 连接或 Google OAuth。正式版目标数据库仍为 `mlpfzynzawzhrowfkqtr`，QA 为 `meqmyxaxnpntjlerrxcb`。
- 证据截图：`E:\wanmaiwangye\work\my-production-created.png`。本轮未修改任何 Supabase 数据或认证配置。

## 2026-11-03 环境及域名最新决定（优先于下文旧地址）

- 用户明确指定现有 Supabase `masuk` (`meqmyxaxnpntjlerrxcb`) 为 Masuk 专属 QA；`masuk-production` (`mlpfzynzawzhrowfkqtr`) 为正式版。此 Masuk QA 不等于被禁止操作的其他旧 QA。
- 用户已将 Cloudflare 账号子域名改为 `pintumasuk.workers.dev`；已通过账号 `f6d7976c32c9c50a893f1688f02b2e38` 的 Worker 列表核验。
- 现有 Worker `masuk` 的 QA 网址：https://masuk.pintumasuk.workers.dev 。此前 rainsky191919 域名配置已过时；QA Google OAuth 相关允许网址尚未同步核验/修复。
- 用户指定正式版目标网址：https://my.pintumasuk.workers.dev ，对应新 Worker 名称 `my`。2026-11-03 表单显示名称 Available，但尚未成功创建/部署。
- 创建向导的 Deploy Hello World 提交被自动审批拒绝：用户指定正式网址不等于授权以 Hello World 占位内容发布正式服务。不得换路径绕过拒绝；如需要先发布占位服务，必须取得明确批准。完整正式源码与 production 后端/登录配置也尚未部署。
- 当前范围仍是 QA/正式版独立域名与环境设置；不能宣称正式网站、多人共享后端或 Google OAuth 迁移已经完成。

## 2026-11-03 新增 production 项目（后续更新，优先于下文旧状态）

- 用户明确要求在组织 `qrzglpkkqmoertxpfazw` 创建独立 production。用户自行完成数据库密码设置与创建提交；未读取或记录密码。
- 已通过同一浏览器核验项目：`masuk-production`，项目 ID `mlpfzynzawzhrowfkqtr`；组织仍为 AdCrown QA，页面账号 `rainsky191919-adcrown`。
- 控制台：https://supabase.com/dashboard/project/mlpfzynzawzhrowfkqtr
- 页面显示 main PRODUCTION、Healthy、Singapore (`ap-southeast-1`)、Nano；组织 Free。
- 创建表单预设：Enable Data API 开启、Automatically expose new tables 关闭、Enable automatic RLS 开启。提交由用户完成，尚未查询数据库验证最终安全配置。
- 本轮仅创建并核验独立项目，没有导入表/数据、配置 Google OAuth 或切换线上网站。原项目 `meqmyxaxnpntjlerrxcb` 继续承载此前已部署功能。
- 新项目创建授权不自动扩大为迁移用户数据、修改旧项目或切换线上站点。后续须按明确任务范围操作。
- 创建成功截图：`E:\wanmaiwangye\work\production-project-created.png`。

更新时间：2026-11-03（Asia/Kuala_Lumpur）。用户准备打开新对话，要求更新本交接。

## 当前结果

- 工作目录：`E:\wanmaiwangye`，Windows PowerShell；当前目录不是 Git checkout。
- 线上网站：https://masuk.rainsky191919.workers.dev/
- 私有源码仓库：https://github.com/rainsky191919-adcrown/masuk
- Google 登录已真实接通：Supabase Google provider 显示 ENABLED；用户亲自创建并填写 OAuth 凭据、完成登录授权；线上显示 Google 显示名称，刷新后会话保留。
- 线上可从 Supabase 读取 21 条公开地点记录。
- **帖子、回复、帮助标记、举报、到访反馈、地点新增/编辑、资料版本及认可仍是浏览器本地存储，不跨设备共享。不能称为已完成多人社区后端。**
- 本次只更新本地交接文件；没有为交接再次上传或部署。

## 已确认的账号与项目边界

| 服务 | 已授权目标 |
| --- | --- |
| GitHub | `rainsky191919-adcrown/masuk`，私有仓库 |
| Cloudflare | 账号 `f6d7976c32c9c50a893f1688f02b2e38`，Rainsky191919@gmail.com's Account；Worker `masuk` |
| Supabase | 组织 `qrzglpkkqmoertxpfazw`，名称 AdCrown QA；项目 `meqmyxaxnpntjlerrxcb`，名称 masuk，Tokyo 区域 |
| Google Cloud | 项目 `masuk-513602`；用户明确确认账号 `skyrainbow5792@gmail.com`（mica sy）是本项目使用账号 |

用户已明确确认：名为 AdCrown QA 的组织是本次新建空组织，允许创建独立 Masuk 项目；不要因名称含 QA 又要求重复确认。禁止写入旧 QA 或其他未授权环境。Google Logs 页面曾报权限错误，但 Google Auth 页面正常，不能据此认定账号错误。

此前 GitHub/Supabase/Cloudflare 插件连接曾指向旧账号。用户说 GitHub 已切换，但当时 GitHub connector 仍返回旧 `skyrainbow57933-tech`；Supabase connector 项目列表为空；Cloudflare connector 也为旧账号。**新对话使用 connector 前重新核对身份，不能把工具可用等同于目标授权。** 本次上传及初始化通过核实身份的浏览器完成。不要读取凭据来绕过连接问题。

## 已实现的产品功能

- React/Vite，深海军蓝和荧光绿；地点搜索、区域/通关友好度筛选、分页。
- 点击地点卡片进入详情，返回保留浏览位置；按地点发帖、回复、分类/排序、帮助标记、举报和删除自己内容（以上社区写入仍本地）。
- 通关友好度：近 30 天至少 3 位不同司机反馈才形成等级；不足为待确认，分歧单独提示，不以公开房产评分或帖子数冒充司机实测。
- 用户可创建缺失公寓：搜索无结果入口、名称/区域/地址、未知门禁信息；Leaflet 地图配 OpenStreetMap 底图、Photon 地名搜索/反查，点击/拖动入口、手动坐标及用户点击才触发的定位；附近/名称重复提示。
- 用户认可当前资料版本或直接修改资料，无管理员审核。修改原因必填，保留旧快照、字段差异、修改者、旧认可；新版本认可清零。浏览器本机标签页有 Web Lock 与版本冲突保护；跨设备仍需服务端处理。
- 生产真实 Google OAuth 使用 PKCE、会话恢复和退出；显示名称只作展示，生产用户固定普通用户角色，不从名称/user_metadata 授予管理员权限。
- 未配置 Supabase 的本地开发仍保留演示登录；其管理员演示身份不能当作生产权限。

## 文件与配置

- `src/App.jsx`：页面、地点表单、本机编辑/认可、真实登录会话。
- `src/components/LocationDetail.jsx`：地点详情、讨论、到访反馈。
- `src/components/AccuracyPanel.jsx`、`src/lib/revisions.js`：版本历史、认可与本机并发检查。
- `src/components/MapPicker.jsx`、`src/lib/placeStorage.js`：地图选点与本机地点。
- `src/lib/community.js`：本机社区数据与友好度统计。
- `src/lib/supabase.js`：浏览器 Supabase client，PKCE；优先 `VITE_SUPABASE_PUBLISHABLE_KEY`，兼容旧 ANON 变量。
- `src/lib/locations.js`：云端地点读取、Realtime 订阅。订阅代码存在不代表数据库已配置 Realtime publication。
- `.env.production`：本地生产构建配置，仅项目 URL 与浏览器可用的公开 publishable key，已被 `.gitignore` 排除。不要在交接或聊天复制 key，不要填写 OAuth secret/service role。
- `.env.example`：占位配置；`DEPLOYMENT.md`、`README.md`：部署和功能边界。
- `supabase/initial_deployment.sql`：本次独立新项目的地点表与 21 条公开种子初始化脚本，**已执行，不能重复跑建表脚本**。
- `supabase/schema.sql` 是早期结构，不代表完整后端，不应盲目执行覆盖当前项目。
- `.gitignore` 排除 node_modules、dist、work、release、实际 .env 配置及日志。

## 数据库与认证状态

- `public.locations` 已初始化；地点 id 为 TEXT，通关难度 0..5，含地址、入口要求、地图/来源等字段。
- 已通过查询验证：21 条，RLS 开启，公共 SELECT 可用，匿名 INSERT/UPDATE 不允许。
- 没有导入本机测试帖子、反馈或用户浏览器记录。
- Supabase Site URL：`https://masuk.rainsky191919.workers.dev`。
- 允许的登录回跳：`https://masuk.rainsky191919.workers.dev/`。
- Google Web OAuth 客户端名 Masuk Web，JavaScript origin 同上站点 origin；Google redirect URI 为 `https://meqmyxaxnpntjlerrxcb.supabase.co/auth/v1/callback`。
- OAuth secret 由用户直接填写在 Supabase。不要打开 Reveal，不要读取密码、token、cookie 或 session 值。认证配置成功不等于所有 Google 用户均已验证可登录；本次只实测了用户选定账号。

## 发布与验证证据

- 最新 Cloudflare 部署：`dd999a07`，Ready，100%；上一版 `5a046f30`。
- 最新 GitHub commit：`b496cf672f9ba489a60ee84718b54ec061dc3ec3`。
- 本轮变更文件 `.env.example`、DEPLOYMENT.md、README.md、App.jsx、supabase.js、LocationDetail.jsx 均与从私有仓库下载的最终 ZIP 逐字节一致（6/6）。
- `npm run build` 通过；只有构建体积提示。
- `node --test work/community_logic.test.mjs` 4/4 通过。
- 线上实测：读取云端资料、Google 账号选择页、用户完成授权后显示名称、刷新保留登录。未实测退出后重新登录。
- 早前社区、地图、认可流程 smoke tests 已通过；本轮登录修改后未重新跑全部 smoke tests。
- 证据目录：`E:\wanmaiwangye\release\20261103-105147`。
- 关键截图：`google-login-success.jpg`、`google-enabled.jpg`、`supabase-auth-urls.jpg`；不应上传 release 截图或聊天记录到仓库。
- 最终源码核对包：该目录的 `masuk-auth-repository-verified.zip`；状态记录 `STATUS.md` 的末尾更新优先于其中旧的 pending 描述。

## 下一步

当前用户只要求交接、准备新对话；不要自行启动下一轮功能开发。若新对话继续实现多人共享：

1. 先读取现有代码和云端结构，明确帖子/回复/反馈/资料修订/认可的服务端模型；不要重建现有 locations 或覆盖本机数据。
2. 依照用户决定允许登录用户直接共同编辑，无管理员审核；服务端仍须验证身份、字段、版本冲突、修改原因和历史记录。
3. 所有 exposed 表启用 RLS；帖子/回复等所有权须由 auth.uid() 校验；不要依赖可修改的 user_metadata 作权限依据，不要用 service role 进入浏览器，不要以关闭 RLS 解决错误。
4. 提供明确的本机旧数据处理方案，不能自动上传浏览器中的历史/测试内容。
5. 完成隔离测试、发布、源码同步与线上验证，再宣称多人共享可用。

## 操作经验

- 用户不喜欢重复确认，遵守整段对话既有授权；遇到真实安全边界才暂停受影响步骤，继续独立工作。
- 浏览器恢复：同一浏览器/Profile 最多新建一个准确目标网址，确认账号与项目，保留旧标签；不猜旧 tab ID、不切换 Profile、不反复枚举。不读取凭据或一次性 URL 参数。
- 最近 CUA 选定浏览器为 in-app browser ID `4`；ID 可能随会话变化，不能直接假定仍有效。`getTab` 曾报 `browser.user is unavailable`，同一连接新开准确目标页恢复成功。
- Supabase Monaco SQL 编辑器 `.fill()` 曾未可靠替换全文；需要全选、删除、粘贴后核对，不能盲目重复执行 SQL。
- Supabase 添加 URL 曾被右下角推广横幅遮挡；关闭横幅后成功，不是权限问题。
- 本地 preview 4173 在 IAB 曾连接超时；已使用真实线上页面验证本轮登录。可能仍有 preview 进程，关闭时确认只关闭本任务进程。
- Python 可执行路径：`C:/Users/yuxia/AppData/Local/Python/pythoncore-3.14-64/python.exe`；系统 `python` 别名曾不可用。
- 新对话如使用 Supabase，先按 Supabase skill 查看当前文档；不要沿用旧 connector 身份假设。
