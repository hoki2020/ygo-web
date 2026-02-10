# ygo-web

中文 | [English](#english)

`ygo-web` 是一个基于开源项目二次开发的游戏王网页对战项目，主要完成了前端界面重构，并支持移动端访问；并提供本地 SRVPro + WebSocket 桥接方案，方便在浏览器中进行联机决斗。

- Frontend: `apps/neos-core` (based on `DarkNeos/neos-ts`)
- Local duel server: SRVPro Docker (`7911/tcp`)
- Browser bridge: `server/ws-tcp-bridge.js` (`7912/ws` -> `7911/tcp`)

---
<img width="2549" height="1266" alt="首页" src="https://github.com/user-attachments/assets/931e912b-c83d-492f-a340-ef66c86ca14f" />
<img width="2549" height="1266" alt="卡组编辑" src="https://github.com/user-attachments/assets/03c13c75-3aea-4362-b847-c52cb4e3cc45" />
<img width="2549" height="1266" alt="对战房间" src="https://github.com/user-attachments/assets/6d70cd18-9685-49b0-bc9c-cc85354ee473" />
<img width="2549" height="1266" alt="对战" src="https://github.com/user-attachments/assets/7641eee3-48e0-4751-b108-fa73840940a3" />

## 中文

### 功能简介

- 基于开源项目进行前端界面重构后的网页端游戏王对战体验
- 本地 SRVPro 对战服务快速启动
- WebSocket 到 TCP 桥接，支持浏览器连接对战服务
- 已支持移动端访问与操作（仍在持续优化）
- 支持在 Neos 基础上继续迭代 Holo Field 视觉风格

### 移动端支持状态

目前已支持**部分移动端访问与操作**（可进入页面、基础浏览与部分对战流程），但仍存在一些已知问题：

- 部分页面在小屏设备上会出现布局拥挤、溢出或遮挡
- 横竖屏切换后的界面适配不稳定（尤其是决斗界面）
- 触摸操作与拖拽/选择交互在部分机型上存在冲突
- 移动端输入体验（软键盘、输入框焦点）仍需优化
- 部分动画和渲染效果在中低端设备上存在性能压力

欢迎通过 Issue 反馈具体机型、系统版本与复现步骤，帮助我们更快定位问题。

### 未来规划（Roadmap）

- 完善移动端自适应布局，重点优化 360px-430px 宽度区间
- 增加移动端专用交互策略（触摸手势、点击热区、拖拽容错）
- 优化横屏决斗体验与关键 HUD 信息排布
- 提升低性能设备的渲染稳定性与帧率表现
- 增加桌面端与移动端关键流程的自动化回归测试
- 持续统一 Holo Field 视觉风格，完善非决斗页面一致性

### 项目结构

- `apps/neos-core` - Neos 前端应用
- `server/ws-tcp-bridge.js` - WebSocket-TCP 桥接服务
- `server/local-data` - 本地卡库/字符串/禁限表/卡图资源目录（开发模式由 Vite 直接映射为 `/local-data/*`）
- `server/docker-srvpro.js` - SRVPro Docker 生命周期管理
- `server/setup-srvpro-docker.js` - SRVPro 初始化脚本
- `docker-compose.srvpro.yml` - SRVPro Compose 配置

### 环境要求

- Node.js 18+
- npm 9+
- Docker Desktop（或 Docker Engine）

### 快速开始（本地）

在仓库根目录执行：

```bash
npm install
npm run neos:install
npm run srvpro:up
npm run dev:wsbridge
npm run dev
```

然后打开 Vite 输出地址（通常为 `http://127.0.0.1:5173/`），在游戏内：

- 进入 `开始游戏`
- 选择 `Local SRVPro (ws://127.0.0.1:7912)`

`npm run srvpro:up` 会自动把 `server/local-data` 下的 `.cdb/.conf` 和 `script/` 同步到 SRVPro 的 `expansions` 目录。

### 常用命令

```bash
npm run dev
npm run build
npm run neos:install
npm run dev
npm run neos:build
npm run dev:wsbridge
npm run srvpro:sync-data
npm run srvpro:up
npm run srvpro:down
npm run srvpro:logs
```

### 部署说明

- 前端构建产物：`apps/neos-core/dist`
- 可部署到任意静态文件服务（Nginx/Caddy/CDN）
- 生产环境建议使用 `wss://`
- 请将桥接服务与 SRVPro 放在内网或受限网络
- 不要将 SRVPro 原始 TCP 端口直接暴露到公网

完整部署与运维说明见：`docs/deployment-manual.md`

### 致谢

本项目基于社区与开源生态构建，特别感谢：

- [DarkNeos/neos-ts](https://github.com/DarkNeos/neos-ts) 的作者与贡献者
- [mycard/ygopro-server](https://hub.docker.com/r/mycard/ygopro-server) 及相关 YGOPro 生态维护者
- [ws](https://github.com/websockets/ws) 的作者与维护者
- React、Vite、Ant Design 以及 `package.json` 中所有依赖库的作者与维护者
- 萌卡社区与游戏王开源生态长期贡献者

衷心感谢所有开源作者与维护者，让这个项目成为可能。

### 免责声明

本项目仅用于学习、技术研究与交流。Yu-Gi-Oh! / 游戏王相关商标及素材版权归其各自权利方所有。

---

## English

`ygo-web` is a Yu-Gi-Oh! web duel project built on top of existing open-source work, with a major frontend UI refactor and mobile support. It also provides a local SRVPro setup and a WebSocket-to-TCP bridge for browser-based dueling.

- Frontend: `apps/neos-core` (based on `DarkNeos/neos-ts`)
- Local duel server: SRVPro Docker (`7911/tcp`)
- Browser bridge: `server/ws-tcp-bridge.js` (`7912/ws` -> `7911/tcp`)
<img width="2549" height="1266" alt="首页" src="https://github.com/user-attachments/assets/931e912b-c83d-492f-a340-ef66c86ca14f" />
<img width="2549" height="1266" alt="卡组编辑" src="https://github.com/user-attachments/assets/03c13c75-3aea-4362-b847-c52cb4e3cc45" />
<img width="2549" height="1266" alt="对战房间" src="https://github.com/user-attachments/assets/6d70cd18-9685-49b0-bc9c-cc85354ee473" />
<img width="2549" height="1266" alt="对战" src="https://github.com/user-attachments/assets/7641eee3-48e0-4751-b108-fa73840940a3" />
### Features

- Web duel experience with a frontend UI refactor based on upstream open-source projects
- Quick local SRVPro startup
- WebSocket-to-TCP bridge for browser connectivity
- Mobile access and interaction support (still being improved)
- Continued Holo Field style customization on top of Neos

### Mobile Support Status

The project currently provides **partial mobile support** (page access, basic browsing, and part of duel flow), but there are known issues:

- Some pages may appear crowded, clipped, or overflow on small screens
- Portrait/landscape adaptation is not fully stable (especially in duel scenes)
- Touch interactions may conflict with drag/select behavior on some devices
- Mobile text input (soft keyboard and focus handling) still needs improvement
- Animations and rendering can be heavy on low-end devices

Issue reports with device model, OS version, and reproduction steps are highly appreciated.

### Roadmap

- Improve responsive layout for mobile, especially in the 360px-430px width range
- Add mobile-oriented interaction strategies (touch gestures, tap targets, drag tolerance)
- Improve landscape duel UX and key HUD information layout
- Improve rendering stability and frame performance on lower-end devices
- Add automated regression coverage for key desktop and mobile flows
- Continue unifying Holo Field visual style across non-duel pages

### Project Structure

- `apps/neos-core` - Neos frontend app
- `server/ws-tcp-bridge.js` - WebSocket-TCP bridge service
- `server/local-data` - local card DB / strings / lflist / image assets (mapped to `/local-data/*` in dev)
- `server/docker-srvpro.js` - SRVPro Docker lifecycle helper
- `server/setup-srvpro-docker.js` - SRVPro bootstrap helper
- `docker-compose.srvpro.yml` - SRVPro compose config

### Requirements

- Node.js 18+
- npm 9+
- Docker Desktop (or Docker Engine)

### Quick Start (Local)

Run from repository root:

```bash
npm install
npm run neos:install
npm run srvpro:up
npm run dev:wsbridge
npm run dev
```

Then open the Vite URL (usually `http://127.0.0.1:5173/`) and in game UI:

- Go to `Start Game`
- Select `Local SRVPro (ws://127.0.0.1:7912)`

`npm run srvpro:up` now auto-syncs `.cdb/.conf` files and `script/` from `server/local-data` into SRVPro `expansions`.

### Scripts

```bash
npm run dev
npm run build
npm run neos:install
npm run dev
npm run neos:build
npm run dev:wsbridge
npm run srvpro:sync-data
npm run srvpro:up
npm run srvpro:down
npm run srvpro:logs
```

### Deployment Notes

- Frontend build output: `apps/neos-core/dist`
- Deploy with any static hosting (Nginx/Caddy/CDN)
- Use `wss://` in production
- Keep bridge and SRVPro in private/restricted networks
- Do not expose raw SRVPro TCP directly to the public internet

For complete deployment and operations guidance, see `docs/deployment-manual.md`.

### Acknowledgements

This project is built on top of great community and open-source work. Special thanks to:

- Authors and contributors of [DarkNeos/neos-ts](https://github.com/DarkNeos/neos-ts)
- Maintainers of [mycard/ygopro-server](https://hub.docker.com/r/mycard/ygopro-server) and the YGOPro ecosystem
- Authors and maintainers of [ws](https://github.com/websockets/ws)
- Authors/maintainers of React, Vite, Ant Design, and all dependencies listed in `package.json`
- The MyCard community and long-term contributors in this ecosystem

Huge thanks to all library and infrastructure authors who made this project possible.

### Disclaimer

This project is for learning, research, and technical communication purposes only. Yu-Gi-Oh! related trademarks and assets belong to their respective owners.
