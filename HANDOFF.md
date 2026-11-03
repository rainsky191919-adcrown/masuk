# Masuk 项目交接

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
