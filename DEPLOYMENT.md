# Masuk 部署说明

## 管理与共享后台部署增量（2026-11-03）

以下代码已在本地实现；云端上线状态以 HANDOFF 和本次 Release Manifest 为准。

- 首先验证对应环境现有表结构。QA 已有 locations，不重跑 initial_deployment.sql；Production 若仍为空，初始化只能从已核验的公开种子建立，不复制 QA 用户/测试内容。
- 本地完整验证与 main checkpoint 完成后，QA 应用增量迁移 `supabase/migrations/20261103042312_shared_admin_community.sql`；随后仅在确认已有已验证目标账号时执行 `supabase/bootstrap_super_admin.sql`。
- 管理角色保存在服务端私有表，以真实 `auth.uid()` 查询；不用邮箱前端判断或可修改 metadata 授权。私有 SECURITY DEFINER 实现用于原子版本、权限和审计事务，固定 search_path，不向客户端开放底层表；public 包装 RPC 为 SECURITY INVOKER。
- 通过 Vite 的 `VITE_SHARED_BACKEND=true` 启用新适配器。环境标志不会自动替换 Supabase URL/key；QA/Production 必须独立核对。只使用公开 publishable key，不读取或复制 OAuth secret/service role。
- 旧本机内容保留，不自动导入云端；上线时从现有云端地点生成历史第一版。社区、反馈、版本认可随后由真实账号分别写入对应环境。
- QA 域名改动后须核验 Supabase Site URL/允许回跳与 Google JavaScript origin；Google provider callback 仍使用该环境的 Supabase auth callback。Production 需独立登录配置与独立已验证账号引导，不能沿用 QA 的用户 UUID。
- 本地数据库测试：`npm run test:db`（需 Docker + PowerShell 7；启动无外网、无端口/挂载的临时测试库并清理）。本地浏览器测试 `tests/shared_ui_smoke.py` 使用 `tests/local_api.py` 的纯测试身份代理和真实本地 PostgREST；该代理仅可用于 loopback，不可部署或用于云端身份验证。

## 固定发布流程

用户于 2026-11-03 明确指定，后续发布按以下顺序执行：

Local 开发 → Local 完整验证 → 更新 HANDOFF → Git checkpoint + push `main` → QA 发布 → QA 浏览器/Android 验收 → 冻结 Release SHA → Production 发布 → Production 最小 smoke → 更新 HANDOFF / Release Manifest

| 阶段 | 完成条件与记录 |
| --- | --- |
| Local 开发 | 在已核实仓库的工作副本开发，保留其他任务和用户的改动。 |
| Local 完整验证 | 构建、相关逻辑和交互回归，以及本次变更影响的完整流程通过；记录命令、结果和已知限制。 |
| 更新 HANDOFF | 记录变更、验证证据、待办及环境边界，不将未执行项目标为通过。 |
| Git checkpoint + push `main` | 提交本次源码和交接，推送至已核实的 `rainsky191919-adcrown/masuk` 的 `main`；确认本地提交与远端 SHA 一致。不得包含密钥、实际环境文件或浏览器用户数据。 |
| QA 发布 | 从该提交构建，以 QA 配置部署 Worker `masuk`；记录 SHA、构建产物校验值和 Cloudflare 部署版本。 |
| QA 浏览器/Android 验收 | 验收相关完整流程，记录浏览器、真实 Android 设备/系统/浏览器及证据。桌面手机尺寸模拟不等于 Android 实测；无法实测则记录未完成，不能越过此关口。 |
| 冻结 Release SHA | 仅在 QA 验收通过后，冻结实际验收的完整 Git commit SHA、QA 部署版本及证据。冻结后代码发生变化须重新验证和 QA 验收。 |
| Production 发布 | 仅从冻结的同一 SHA 构建并部署 Worker `my`，使用独立 Production 配置；不得混用 QA 后端。Vite 配置在构建时注入，QA 与 Production 产物可不同，分别记录其校验值。 |
| Production 最小 smoke | 核验正式网址、页面加载、正式后端身份和核心只读路径；登录相关变更须核验登录。需要写入时仅使用任务已授权、可安全清理的测试范围，禁止直接搬运 QA 或本机测试数据。 |
| 更新 HANDOFF / Release Manifest | 记录最终状态、冻结 SHA、两个环境部署版本、验收与 smoke 证据、已知限制及回滚目标。发布后交接的独立文档提交须与实际应用 Release SHA 区分。 |

具体任务授权与平台审批继续有效；验证通过或遵循本流程本身不产生新的授权。未完成必需关口时停止依赖该关口的发布步骤，继续独立工作并如实报告。

### 环境对应关系

| 环境 | Cloudflare Worker / 网址 | Supabase 项目 |
| --- | --- | --- |
| QA | `masuk` / https://masuk.pintumasuk.workers.dev/ | `masuk` / `meqmyxaxnpntjlerrxcb` |
| Production | `my` / https://my.pintumasuk.workers.dev/ | `masuk-production` / `mlpfzynzawzhrowfkqtr` |

当前 Production 仅为已获批准的 Hello World 占位页；应用、数据库连接及登录尚未接入。QA 更换域名后的 OAuth 配置仍待核验。组织名称 AdCrown QA 不改变上表中的环境划分。

### Release Manifest

每次发布使用独立的版本记录（例如 `releases/<release-id>/manifest.json`），至少包含：

- 发布标识、时间与时区、发布范围、完整冻结 Release SHA 和远端分支。
- Local 验证结果及证据；QA 的网址、Worker、Supabase 项目 ID、构建产物校验值和部署版本。
- QA 浏览器及真实 Android 验收结果、设备信息、证据和冻结时间。
- Production 的网址、Worker、Supabase 项目 ID、构建产物校验值和部署版本。
- Production 最小 smoke 结果及证据、最终状态、已知限制、前一已验证部署/回滚目标及必要数据库兼容说明。
- 仅记录非敏感配置标识；不得写入密码、token、会话、OAuth secret 或服务端密钥。状态区分未执行、通过、失败和受阻，不提前填 PASS。

生产构建已接入 Supabase Google 登录及云端地点读取。地点编辑、讨论、反馈和认可仍保存在用户浏览器；真实登录不会自动让这些内容变为多人共享。

生产构建需要 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`；公开发布密钥可供浏览器使用，不能填写 Google 客户端密钥或 Supabase 服务端密钥。未配置环境的本地开发仍使用演示登录。生产用户的名称仅用于展示，不授予管理员权限。

## 本次指定的目标

- GitHub：`rainsky191919-adcrown`，私有源码仓库。
- Supabase：组织 `qrzglpkkqmoertxpfazw`，用户已确认这是本次新建空组织，允许创建独立 Masuk 项目。
- Cloudflare：账号 `f6d7976c32c9c50a893f1688f02b2e38`。
- Google Cloud：`masuk-513602`，用于后续 Google 登录配置，不重复托管网站。

插件连接必须与上述浏览器账号一致。不得使用旧插件账号上传项目。

## 静态前端

构建：`npm ci`、`npm run build`。构建输出目录为 `dist`。

上传范围：源码、依赖清单、说明和公开数据库结构。不要上传 `.env*` 的实际配置、浏览器本机数据、密钥、`node_modules`、测试截图或测试浏览器记录。

静态页面可部署到 Cloudflare。部署后应验证首页、地图、地点详情和本机讨论流程，并明确告知用户当前未跨设备共享。

## 共享后端与真实登录

当前 `supabase/schema.sql` 只是早期地点读取结构，不能直接当作全部功能的正式后端。应先接入真实认证、地点及版本存储、帖子回复、反馈及版本认可，再启用多人写入。

真实共享编辑需服务端检查版本冲突、记录修改者和原因、保留历史认可；客户端不得授予管理员身份，不得把服务端密钥暴露给浏览器。Google OAuth 客户端的机密配置应由用户在安全页面中填写，不放进源码或聊天。

创建数据库时使用独立新项目，先检查目标表和权限，避免触碰旧 QA 或其他项目。涉及收费升级、协议接受或新的长期敏感授权时先由用户确认。
