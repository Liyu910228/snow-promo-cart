# 演示部署说明

本项目当前适合按“纯前端静态站”部署给业务演示使用。演示数据存放在浏览器 `localStorage`，不需要后端服务或数据库。

## 服务器要求

- Linux 服务器
- Node.js 18+ 或 20+
- Nginx

## 构建

```bash
npm ci
npm run build
```

构建产物在 `dist/` 目录。

## Nginx 部署

示例配置见：

```text
deploy/nginx-demo.conf
```

关键点是 Vue Router 使用 history 模式，必须配置：

```nginx
try_files $uri $uri/ /index.html;
```

否则刷新 `/home`、`/admin/products` 等页面会 404。

## 演示账号

- 管理员：`admin / admin`
- 业务员：`root / 12345`

## 演示限制

- 数据只保存在当前浏览器的 `localStorage`。
- 不同设备、不同浏览器之间数据不会自动同步。
- 账号密码为前端 mock，仅适合业务演示，不适合正式生产。
- 如需多人真实协作，需要接入后端 API 和数据库。

## 快速上线步骤

```bash
cd /home/admin/dataCollection
npm ci
npm run build
sudo cp deploy/nginx-demo.conf /etc/nginx/conf.d/snow-promo-cart.conf
sudo nginx -t
sudo systemctl reload nginx
```

如果你的站点目录不是 `/home/admin/dataCollection/dist`，请同步修改 Nginx 配置里的 `root`。
如果服务器 IP 或域名变化，请同步修改 Nginx 配置里的 `server_name`。
