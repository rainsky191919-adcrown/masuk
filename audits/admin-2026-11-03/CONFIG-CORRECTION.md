# 两环境配置纠正与新版QA准备

2026-11-03。用户已要求配置纠正及新版QA/真实Android验收；正式发布未被请求。

更新：用户重新连接后，同一范围Git暂存已成功，以下只读阻断已成为历史记录。继续执行源码checkpoint、重建QA与新版验收，尚不提前宣称发布或实机验收通过。

## 已完成

- 在同一IAB中核实Cloudflare目标账号、QA Worker `masuk`和域名；当前QA仍为`f150c7b8`、Ready100%。核实Supabase组织及两个独立项目、当前Owner身份。
- Cloudflare插件仍为旧账号、Supabase插件无可见项目，均未用于操作；GitHub插件/CLI为正确的rainsky191919-adcrown，远端main初步核对仍与本地基准593646f一致。
- 从对应项目页面分别取得公开publishable key，未读取、展示或复制任何secret key/会话。纠正根目录`.env.production`并保留旧文件备份，新建`.env.qa`；两者启用共享后台，受Git忽略，真实密钥值不进入交接。
- `npm run build:qa` → `dist/qa`，只含QA项目；`npm run build:production` → `dist/production`，只含正式项目。两个目录独立，不上传整个dist父目录或历史根级文件。
- 新增构建前校验，拒绝错误项目、未启用共享、非公开/冗余密钥及意外VITE暴露变量。两环境的公开build-info记录项目/Worker/origin/源码SHA，不包含密钥。
- `npm run check:qa`和`npm run check:production`通过，记录分别在PREFLIGHT-qa.json及PREFLIGHT-production.json；这是未提交源码的本地候选检查，不是冻结SHA或部署记录。
- 隔离测试正式纳入`tests/admin-ui`，开发依赖锁定jsdom30.1.3；`npm run test:admin`40组及`npm run test:build-config`4组通过。
- 安装时检测到既有构建链告警，将Vite同主版本更新为8.3.5并更新兼容source-map-js后，npm报告0项漏洞；修改后完整后台回归通过。相关依据：[Vite维护者公告](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw)、[source-map-js公告](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)。
- 对真实Vite入口执行两项错误配置负例：QA共享关闭、Production注入QA后端，均在产物输出前被拒绝。没有修改持久配置或绕过检查。
- 真机已连接：Huawei VOG-L29、Android10，当前Chrome安装包156.0.8078.79。仅检查设备和包元数据；连接就绪不代表新版Android验收通过。

## 未完成原因

固定发布流程要求本地验证之后，先源码checkpoint/push main，再从该SHA构建并发布QA。

自动审批两次拒绝精确范围的`git add`，理由是工作区`.git`被开发者/应用层规则设为只读。第二次请求已附带用户明确的“允许该工作区写入Git”回复，审批仍拒绝。Git index未被修改；没有绕用GitHub写API、其他仓库或直接上传跳过此关口。

因此本轮**QA尚未发布，新版QA浏览器与真实Android验收尚未执行，Release SHA尚未冻结，Production未改动**。本机dist中的build-info仍对应提交前基准，解除限制后必须从实际checkpoint重建，不可直接上传当前候选目录。

## 继续条件

用户对本任务的Git授权已经收到。现在需要实际解除应用层Git只读限制，或由用户完成精确范围的源码提交/推送。恢复后先复核远端与本地SHA，再从该checkpoint重建QA，执行产物校验、发布及新版浏览器/Android验收。不要要求用户提供密码、OTP、访问Token或Secret；不要重复执行数据库初始化和角色引导。
