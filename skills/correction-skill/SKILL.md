---
name: correction-skill
description: >
  记录并复用本项目常见问题的排查、纠错和验证流程。适用于页面显示异常、部署异常、样式丢失、接口不可用、数据不同步、构建失败等问题的定位和修复。
metadata:
  short-description: 记录项目纠错流程
---

# 纠错 Skill

## 使用流程

1. 先确认问题发生位置：本地、线上、浏览器缓存、构建产物、Nginx 或后端服务。
2. 查找 `references/correction-playbook.md` 中是否已有相同问题。
3. 修复时保持变更最小，并记录根因、修改文件和验证方式。
4. 线上问题修复后必须验证公网入口、服务状态和相关静态资源。

## 资源

- 纠错手册：`references/correction-playbook.md`
