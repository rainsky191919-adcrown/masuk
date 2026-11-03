# 新版后台 QA 与真实 Android 验收

结论：PASS after auto-fix。完成日期 2026-11-04（Asia/Kuala_Lumpur）。本报告补充早期仅本地验收报告，不能将其中历史阻断状态当作当前结果。

## 版本与环境

- 已推送应用 SHA：`f6c5a54f2d16e95e044a3fe63771692c2bcbfa52`；验收后冻结同一 SHA。后续文档提交与应用 SHA 分开记录。
- QA：`https://masuk.pintumasuk.workers.dev/`，Worker `masuk`，Supabase `meqmyxaxnpntjlerrxcb`，部署 `0f68edb0`。线上 `/build-info.json` 确认目标、共享后台和完整源码 SHA。
- ZIP SHA256：`08cf0eda79135c526cab7c788dec53b15bcbea1c9c15aee4d1cc479e7bb9bf9c`。QA 回滚目标 `f150c7b8`。
- 两环境本地产物预检通过；源码指纹 `31c48e92c457c7e0078b664db77ef1602376e60de51a4e7de2449c13c75a09b2`。真实 `.env`、截图和产物不上传 Git。
- 本轮没有 Production 发布、数据库迁移、初始化或角色引导。上轮正式发布 `339c9239` / `db7a30a18c5bf8df2be68cfea4ca3cd7c38f085d` 保持本轮未改动；正式发布前另行核对。

## 已执行验收

| 范围 | 结果与边界 |
| --- | --- |
| 真实 QA 会话与管理页 | 桌面与 Android 保留真实 Google Super admin 登录；21 个云端地点；单一可见 H1、紧凑页头、成功载入时间及五模块导航正常。未读取凭据或会话。 |
| 地点管理与编辑返回 | 桌面搜索 Skudai、区域/状态筛选、第二页编辑 Mutiara Maju Cluster 后取消，保留列表条件、第二页及原按钮焦点；Android 搜索 Iconia 匹配 1/21，版本 1 编辑页路径返回保留查询。未保存真实地点。 |
| 账号权限摘要 | 桌面使用虚构 `.invalid` 邮箱与预览原因检查未知角色及确认摘要，返回修改；Android 核对账号与目标权限说明。未点击最终权限确认；服务端拒绝/最后一个 Super admin 等由本地隔离测试覆盖，不冒称本轮真实角色写入验收。 |
| 跨设备内容 | 桌面发布明确 QA 合成帖及回复，Android 刷新读到同一内容；Android 置顶，桌面见已置顶后取消，操作记录保存。 |
| 举报处理闭环 | Android Chrome 原生原因弹窗提交测试帖举报；桌面后台收到同一唯一标题，处理为 resolved 并勾选隐藏。Android 公开详情同步为讨论 0。 |
| 隐藏与恢复 | Android 恢复本轮测试帖成功，再次隐藏成功；仅隐藏本轮测试回复。桌面刷新核对两项均已隐藏，最终公开详情为讨论 0。原有隐藏测试内容未变更。 |
| 操作记录 | 载入 9 条；桌面按本轮标记与处理举报动作组合筛选匹配 1 条，展开原始时间/动作/对象/原因；手机按 Synthetic 搜索匹配 3 条，卡片含可读对象、动作及隐藏原因。 |
| 布局与可读性 | 真实 Android Chrome 页面及管理区域可操作，输入、卡片和导航无观察到的横向截断；线上 320px 窗口复验 clientWidth=scrollWidth=305，单一可见 H1。此前本地 320/390/1280 与地图/焦点检查仍列为本地证据，未冒称真实手机尺寸。 |

真实手机：Huawei VOG-L29，Android 10，Chrome 156.0.8078.79。操作仅限用户已授权的 Masuk QA 页面和截图。

自动检查已在应用 checkpoint 前通过：40 组后台回归、4 组构建配置边界、4 项既有社区逻辑、隔离本机数据库权限/冲突/审核基线；Vite 真实错误环境构建被拒绝；依赖审计 0。验收后再次运行两环境产物预检通过，并确认应用源码/配置/测试相对 checkpoint 无变更。

## 清理结果

- 帖子 `[QA_UI_f6c5a54] Desktop Android moderation acceptance`：已隐藏、未置顶。
- 回复 `[QA_UI_f6c5a54] Test reply for the real Android moderation check.`：已隐藏。
- 本轮举报：resolved，处理说明明确为合成 QA 验收；待处理举报 0。
- 最终公开详情：讨论 0，无测试帖；历史审计保留。旧测试帖/回复原隐藏状态保持。

## 恢复与限制

- Git 写入恢复后 checkpoint/push 成功。上轮 Android 原受审操作因审批服务用量限制未执行；本轮用户继续后同一路径成功，无绕过。普通远端查询解析失败，经获准网络路径重试确认远端 SHA。
- IAB 不支持现有业务 `prompt()`，曾记录工具限制错误；原生举报/隐藏/恢复在真实 Android Chrome 完成。没有为了工具限制改动产品代码，也不宣称 IAB 全程零错误。
- 手机中文输入法曾转换举报原因中的字母数字，提交前已观察到转换；原因仍明确为合成 QA 测试，举报对象由完整唯一标题核对。后续原因使用普通英文词并核对入库审计。
- 现有 JS 单包约 660kB（gzip 约 192kB）提示保留；跨设备依赖 15 秒轮询及窗口聚焦，不宣称即时推送。
- 本轮不是真实角色变更、地点写入/冲突的云端重测、完整读屏/WCAG 或全 Android 机型认证；对应权限/冲突逻辑沿用未改动服务端和本地隔离测试。

证据仅保存在忽略目录 `release/20261103-admin-ui/`：`qa-cleanup-final.png`、`qa-report-audit-final.png`、`qa-320-audit-final.png`、`android-report-submitted.png`、`android-report-processed-public.png`、`android-test-reply-cleaned.png`、`android-audit-filtered.png`、`android-admin-roles-final.png`；前一轮同目录还含编辑返回与跨设备置顶证据。截图不得上传仓库。

下一步：单独获得正式发布授权后，从冻结应用 SHA 构建并发布 Production，执行最小 smoke；不得因 QA PASS 自动发布正式站。
