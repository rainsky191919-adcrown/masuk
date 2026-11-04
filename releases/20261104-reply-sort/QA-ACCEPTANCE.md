# 回复排序 QA／Android 验收

2026-11-04，Asia/Kuala_Lumpur。应用冻结SHA `547b1b21825ba4a2d18d0fc159dbb488d83863e4`，checkpoint已推送并确认远端main一致。QA Worker `masuk`部署`bd88a9a5`，Ready／100%；前一已验证应用`564b632e`保留作回滚。后续验收文档提交不改变实际应用SHA。

## 发布与数据

确认Supabase目标`meqmyxaxnpntjlerrxcb`、AdCrown QA及Cloudflare指定账号／Worker／域名。应用增量`20261104160000_reply_sort.sql`，没有重跑初始化或角色引导；迁移后21地点／4帖／13回复，未新增、删除、隐藏或编辑业务内容。旧客户端缺省顺序保持从早到晚，回滚前端不需要删除新增排序能力。

从checkpoint使用QA配置构建，预检通过；线上build-info的完整SHA、项目、Worker及共享标志正确。build-info、HTML、CSS、JS四资源哈希均与本地包匹配，详细哈希及ZIP见manifest和忽略的原始证据目录。

## QA 浏览器

10项针对性检查通过：默认最早回复；最新优先第一页10条且首条为最新；第二页只剩最早一条；详情返回保留排序及页码；看最新回复回到第一页；切回最早优先重置第一页；最新快捷入口、320无横向溢出、空回复切换。无捕获到的控制台error。

使用原有帖子《111》的11条回复验证真实服务端排序，未生成线上夹具。390×674与320×674辅助手机检查。最终恢复默认列表、浏览器尺寸和原登录，只关闭本轮新建的管理副本。

## 真实 Android

Huawei VOG-L29／Android10／Chrome。真机公开build-info确认同一SHA与QA身份。实际触摸原生选择器选择“最新回复优先”，第一屏显示“按时间从新到旧 · 第1–10条／共11条”，首条为已有最新回复；下一页显示“第11–11条／共11条”，仅剩已有最早回复。切回“最早回复优先”后回到第1–10条且首条为最早回复。最后恢复默认21个地点列表。

开始时真机已锁屏，停止依赖操作；用户自行解锁并明确回复后继续。没有读取／输入密码或绕过锁屏。最初黑屏截图不作为验收证据。发布前Git检查另发现迁移文件末尾空行，修正格式后checkpoint通过；未改变SQL行为。

原始截图及UI记录仅在忽略目录`release/20261104-reply-sort`：android-build、android-latest、android-latest-page-two、android-final、browser-latest、cloudflare-ready及browser-checks.json。已打开复核真机版本与最新优先截图。

本地43项讨论浏览器、隔离数据库迁移／权限／排序与定位、构建及差异检查通过，细节见`tests/discussion-ui/REPLY-SORT.md`。本次线上只验收相关读取路径，未重新测试写入；失败恢复与草稿保留由本地隔离测试覆盖，不代表完整性能或无障碍认证。

**Production未发布、未迁移。** 后续正式发布须单独授权，并从本冻结SHA使用独立Production配置与对应增量，不能上传QA包或重跑初始化。
