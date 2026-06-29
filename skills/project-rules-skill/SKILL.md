---
name: project-rules-skill
description: >
  维护本项目内置规则、协作约定、部署约定和工程边界。适用于新增功能、修改页面、部署到腾讯服务器、调整 skill、整理项目规范或检查改动是否符合项目规则时使用。
metadata:
  short-description: 维护项目内置规则
---

# 项目规则 Skill

## 使用流程

1. 修改前阅读 `references/project-rules.md` 中和当前任务相关的规则。
2. 代码变更遵循现有 Vue 3、Vite、Pinia、TDesign 和项目部署方式。
3. 涉及腾讯服务器时沿用项目既有 18123 公网入口和内网 API 端口约定，除非用户明确要求变更。
4. 涉及 skill 时保持 `name` 和目录名稳定，中文化 `description`、`metadata.short-description`、`agents/openai.yaml` 的展示字段。

## 资源

- 项目规则：`references/project-rules.md`
