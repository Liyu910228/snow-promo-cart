# 项目纠错手册

## 线上样式异常

现象：页面局部退化成浏览器默认样式，按钮和表格没有项目样式。

排查顺序：

1. 确认线上 `index.html` 是否引用最新构建文件。
2. 确认对应异步 CSS 文件是否存在并能通过公网访问。
3. 检查页面 scoped CSS 是否只存在于异步 chunk，必要时把关键通用样式提升到后台布局或全局样式。
4. 重新构建并部署后，验证公网首页、API 健康检查和相关 CSS 内容。

已知案例：账号管理页样式异常时，将按钮、筛选框、表格、标签等关键样式补进 `src/views/admin/AdminLayout.vue` 的后台统一样式层。

## 部署后 API 瞬时失败

现象：部署脚本刚重启 systemd 服务后，立刻访问 `127.0.0.1:3012` 偶发失败。

处理：

1. 查看 `systemctl status snow-promo-cart-api --no-pager -l`。
2. 查看 `journalctl -u snow-promo-cart-api -n 80 --no-pager`。
3. 等待服务监听后再验证 `http://127.0.0.1:3012/api/health`。
