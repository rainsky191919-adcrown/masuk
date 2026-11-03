# Masuk? · Guardhouse Intel

给 Grab、inDrive、Foodpanda 和 ShopeeFood 司机使用的 Johor / Skudai 住宅区、公寓 Guardhouse 门禁情报板。

## 本地运行

```bash
npm install
npm run dev
```

打开终端里显示的本地地址即可。生产构建：

```bash
npm run build
```

## 目录说明

- `src/App.jsx`：搜索、区域/难度筛选、地点详情卡片、复制规则、UGC 表单和本地新增逻辑。
- `src/data.skudai.js`：Skudai 真实项目资料、Google Maps 链接与公开来源链接。门禁细节未公开的地点会标为“待司机验证”。
- `src/lib/supabase.js`：读取 Vite 环境变量并创建 Supabase 客户端。
- `src/lib/locations.js`：查询 `locations` 表并订阅 Supabase Realtime 变化。
- `src/styles.css`：移动端优先的深色司机仪表盘视觉系统。
- `supabase/schema.sql`：可在 Supabase SQL Editor 执行的 PostgreSQL Schema、索引、更新时间触发器和公开读取策略。

## 接入 Supabase

1. 在 Supabase 项目中执行 `supabase/schema.sql`。
2. 复制 `.env.example` 为 `.env.local`，填入 Project URL 和 anon key。
3. 运行 `npm run dev`。页面会从 `locations` 读取，并监听新增、修改、删除后自动刷新。

没有配置环境变量时，页面会自动使用 `src/data.skudai.js` 的本地资料作为兜底。

UGC 建议先写入待审核表或通过 Edge Function 处理，避免匿名用户直接修改已验证记录。

## 地点讨论与通关反馈

点击地点卡片或「查看详情与发言」进入地点详情。返回列表保留原搜索、筛选、页码与滚动位置。

- 游客可以阅读；沿用本机演示登录后，可发帖、回复、标记有帮助、标记举报和删除自己的内容。演示管理员可置顶帖子。举报仅本机标记，不会发送到云端。
- 帖子可分为提问、经验分享、规则变化，支持分类及最新活动／最多帮助排序。
- 「我刚去过」记录到访日期、时段、服务类型、通关感受和现场要求。同一演示账号在同一地点保留最新一条反馈。
- 近30天至少3位司机的反馈才形成综合等级；不足时显示待确认。体验跨越3档以上时提示存在分歧。帖子本身不会改变等级。
- 所有新增社区内容保存于此浏览器的 `masuk-community-v1`，刷新可保留，同源标签页同步。清除浏览器数据会删除这些本地记录；尚未提供真实身份验证和跨设备共享，请勿将演示身份权限视为正式社区权限。
- 不会改动云端表、认证或安全策略。开放多人社区前，需要接入真实登录、服务端权限及帖子／回复／反馈存储。

相关文件：`src/components/LocationDetail.jsx`、`src/lib/community.js`。

## 地图选点与新增公寓

- 「报一个新点」或搜索无结果的「新增这间公寓」可创建地点，后者会带入搜索名称。
- 必填名称、区域、地址；门禁规则可以暂不填写，默认待确认。
- 「在地图上选位置」支持地名搜索、点击地图、拖动入口标记、浏览器定位、手动经纬度与附近地址查询。必须点击「使用这个位置」才将草稿坐标写入表单；地址允许手动修正。建议选择车辆入口或保安亭。
- 浏览器定位仅由用户点击触发，不自动查询当前位置。Photon 请求也仅由按钮触发，并有请求超时、缓存及失败提示。
- 已确认坐标用于 Maps 导航。搜索或地图服务不可用时，仍可手动填写地址创建地点。
- 相似名称或150米内已有地点会提示重复；确实为不同公寓可以确认后继续。创建后直接打开地点详情，可发起第一篇讨论。
- 新增和编辑保存到 `masuk-local-places-v1`，刷新后与基础地点资料合并，云端读取不会覆盖本机修改。此功能尚未跨设备共享。

地图使用 Leaflet 1.9，底图为 OpenStreetMap，预览搜索使用 Photon 公共服务。部署到较大访问量环境前配置自有或托管地理编码服务。可通过 `VITE_GEOCODER_URL`（Photon兼容接口）及 `VITE_MAP_TILE_URL`（XYZ模板）切换服务；更换底图供应商时同步更新 attribution。公共服务不保证可用性，详情见 [Photon 使用说明](https://github.com/komoot/photon#demo-server) 和 [OpenStreetMap 底图政策](https://operations.osmfoundation.org/policies/tiles/)。

地图回归测试：`work/map_smoke.py`，覆盖真实地名搜索及可控的搜索失败、定位拒绝、拖标、坐标导航、刷新保留、重复提示和手机布局。

## 资料认可与共同编辑

地点详情的进门要求下方提供「资料准确」和「有出入，我来修改」。演示登录用户均可修改，填写修改原因后立即生效，无需管理员审核。

- 每个账号对当前版本只有一份认可，可取消并可选填到访日期；认可与通关友好度分开计算。
- 内容修改后生成新版本，当前认可从零开始，旧版本认可保留在历史记录。单纯认可／取消不会生成版本或改变资料修改时间。
- 历史包含修改者、时间、修改原因、字段差异、完整旧资料和当时认可人数。现有地点从第一版开始记录，原有 verified_count 不冒充新功能的认可数。
- 保存前比较编辑时的版本与最新版本。如果其他标签页已更新，保留草稿并展示双方差异，不覆盖；用户可以明确选择载入最新版后重新编辑。
- 支持 Web Locks 的浏览器会对本机标签页之间的地点写入串行处理。正式多人跨设备编辑仍需服务端版本校验；目前资料、版本和认可继续仅保存在此浏览器，不提供真实身份安全保证。

相关文件：`src/lib/revisions.js`、`src/components/AccuracyPanel.jsx`。回归测试 `work/accuracy_smoke.py` 使用临时浏览器验证两标签页冲突、版本认可隔离和保存失败。

验证：`npm run build`；`node --test work/community_logic.test.mjs`；已安装 Python Playwright 的环境可运行 `work/community_smoke.py`，该测试使用独立临时浏览器，不会写入云端。

## 2026-11-03 登录部署更新

生产构建现已接入 Supabase Google OAuth（PKCE）、会话恢复及退出，并读取云端公开地点。配置参见 DEPLOYMENT.md 与 .env.example。Google 客户端密钥只保存在 Supabase，前端只使用公开发布密钥。生产身份不从演示账户或显示名称获得管理员权限。

上文涉及演示登录的描述仅适用于未配置 Supabase 的本地开发。资料编辑、讨论、反馈、版本认可仍是浏览器本地功能，尚未跨设备共享。当前已有独立云端 locations 表，不要对已部署项目重复执行初始化建表脚本。
