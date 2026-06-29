# 项目内置规则

## 项目位置

- 当前应用目录：`D:\liyucode\join-4-27\join\join`
- 项目 skill 目录：`D:\liyucode\join-4-27\join\join\skills`

## 技术栈

- Vue 3
- Vite
- Pinia
- TDesign Vue Next
- 轻量 Node API：`server/api-server.mjs`

## 部署约定

- 腾讯服务器：`119.45.222.120`
- 公网端口：`18123`
- 应用目录：`/opt/snow-promo-cart`
- 前端目录：`/opt/snow-promo-cart/dist`
- 后端服务：`snow-promo-cart-api`
- 后端内网端口：`127.0.0.1:3012`
- 公网访问：`http://119.45.222.120:18123/`

## Skill 元数据规则

- `SKILL.md` frontmatter 的 `description` 必须使用中文。
- `SKILL.md` frontmatter 必须补充 `metadata.short-description` 中文短描述。
- 如果存在 `agents/openai.yaml`，`interface.display_name` 和 `interface.short_description` 必须使用中文。
- 保持 skill 的 `name` 和目录名不变，避免破坏 `$skill-name` 触发方式。
