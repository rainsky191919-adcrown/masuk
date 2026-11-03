# Masuk 部署说明

## 当前状态：新版 QA / 真机验收通过，待单独授权正式发布（2026-11-04）

应用源码已在 `f6c5a54f2d16e95e044a3fe63771692c2bcbfa52` checkpoint 并推送，QA 部署 `0f68edb0` 完成桌面与 Huawei VOG-L29（Android 10 / Chrome 156.0.8078.79）验收。测试帖和回复均已隐藏，测试举报已处理，待处理为 0；无真实角色或地点变更。已冻结同一应用 SHA；当前文档提交不构成新的应用版本。

两环境独立构建与预检均通过。正式发布须使用冻结 SHA 的独立检出目录与 Production 配置，上传 `dist/production` 内容；不从后续文档提交重建并冒充已验收 SHA。本轮未发布正式站；上次已发布版本见 `releases/20261103-admin-community/manifest.json`，下文 Hello World 等旧状态是历史记录。新版证据及限制见 `audits/admin-2026-11-03/QA-ACCEPTANCE.md` 和本轮 Manifest。下一步需用户单独授权正式发布，再核对目标与回滚版本，完成正式最小 smoke。无新数据库迁移，不重跑初始化或角色引导。

## 当前进度：Git写入恢复，准备新版QA checkpoint（2026-11-03）

用户重新连接后，同一范围Git暂存已成功。此前只读阻断记录保留为历史；继续按checkpoint/push→从该SHA重建QA→QA发布→浏览器/真实Android验收执行。两环境配置及本地检查已通过，Production仍不在本次发布范围。

## 新版后台配置已纠正，QA等待源码checkpoint（2026-11-03）

- 用户已要求纠正两环境配置并进行新版QA/真实Android验收。根目录`.env.qa`与`.env.production`现已从核实身份的项目页面分别配置，仅含各项目公开publishable key，并启用共享后台；真实值不得提交。旧配置已备份在忽略目录。
- `npm run build:qa`输出`dist/qa`；`npm run build:production`（或`npm run build`）输出`dist/production`。**仅上传目标子目录内容，不上传整个dist父目录或历史根级文件。** 两者由Vite构建前核对后端项目与共享标志，不匹配即失败。
- `npm run check:qa`与`npm run check:production`分别校验对应产物、公开构建信息及源SHA；报告为`audits/admin-2026-11-03/PREFLIGHT-qa.json`和`PREFLIGHT-production.json`。旧`PREFLIGHT.json`保留为之前拒绝放行的历史记录。
- 清洁检出后`npm ci`、`npm run test:build-config`及`npm run test:admin`可复现配置边界与40组隔离回归；夹具不用于发布。例子见`.env.qa.example`、`.env.production.example`，填写时只用对应项目的公开客户端密钥。
- 新版仍须完成源码checkpoint/push、QA发布、浏览器/真实Android验收与冻结；正式发布不包含在当前请求中。最新状态见HANDOFF及`releases/20261103-admin-ui/manifest.json`。
- 当前checkpoint被应用工作区的Git只读限制拦截。用户已明确允许写入Git，但自动审批仍拒绝暂存；不得通过其他工具/仓库绕过，也不得跳过checkpoint直接上传。需实际解除平台限制或由用户完成提交推送后继续。详见`audits/admin-2026-11-03/CONFIG-CORRECTION.md`。

## 本轮后台体验优化：上线前检查未通过（2026-11-03，尚未发布）

10项后台优化及整体验收补修仍在本地，不能沿用下文旧版本的QA/Android验收结论。完整结果见 `audits/admin-2026-11-03/ACCEPTANCE.md`，本次未提交或发布。

- 当前根目录 `.env.production` 是遗留配置：实际指向QA，且未启用共享后台。默认 `npm run build` 虽能成功，但**该产物不得上传至正式 Worker `my`**，也不是本次可冻结的QA验收产物。
- 后续需为QA和Production分别核对公开配置及共享后台标志，再从同一源码提交构建；不能仅凭文件名认定环境，也不能从旧验收记录推断当前平台配置。
- 默认构建后，在仓库根目录运行 `node scripts/check-release-preflight.mjs`。它只读本地配置和产物，不输出密钥值，不连接云端，核对正式项目、共享后台、公开密钥类型、测试夹具及明显私钥前缀，并记录源码/产物SHA256。配置或产物不匹配时以非零状态退出。
- `audits/admin-2026-11-03/PREFLIGHT.json` 是本次诊断快照，状态为不可发布，不是已冻结Release Manifest，也不自动代表部署或QA/Android通过。
- 新版仍须依次完成源码checkpoint与推送、QA部署/浏览器与真实Android验收、冻结SHA、单独的正式发布步骤；不要重复执行已发布数据库的初始化或角色引导脚本。本轮没有数据库迁移。

## 当前已发布版本（2026-11-03）

共享管理后台已完成本地验证、QA 浏览器与真实 Android 验收、冻结源码及 Production 最小 smoke。应用 SHA `db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d`；QA 部署 `f150c7b8`、Production 部署 `339c9239`。指定邮箱已在两个独立环境的真实账号中分别获得 super admin。下文“本地实现，待云端上线”及“Production 占位页”是历史准备说明，最终状态以 HANDOFF / Release Manifest 为准。

两环境已经执行本次初始化/增量脚本，不要重复建表。后续变更继续遵守固定流程。Production 的平台自动 RLS 函数额外收紧了默认执行权限：`REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;`。这仅限制客户端直接执行平台事件辅助函数，自动 RLS 事件触发器保持启用，应用 RPC 不受影响。安全建议复查为 0 errors；泄漏密码保护默认关闭的警告仍存在，前端登录使用 Google OAuth。

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
