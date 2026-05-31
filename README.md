# AloneWork

<p align="center">
  <strong>基于 AI 驱动的开发工具</strong>
</p>

<p align="center">
  <a href="https://github.com/AlonechatWorkspace/AloneWork-cli">GitHub</a> |
  <a href="https://github.com/AlonechatWorkspace/AloneWork-cli/issues">Issues</a>
</p>

---

## 简介

AloneWork 是一款基于 AI 的智能开发工具，基于 [OpenCode](https://github.com/anomalyco/opencode) 进行二次开发。

## 特性

- 🤖 AI 驱动的代码生成与理解
- 📝 智能代码编辑与重构
- 🔧 集成开发环境支持
- 🚀 高性能终端界面
- 🔌 插件系统支持

## 开发

### 环境要求

- [Bun](https://bun.sh/) >= 1.3.14
- [Node.js](https://nodejs.org/) >= 18

### 项目结构

```
alonework/
├── packages/
│   ├── opencode/      # 核心包
│   ├── desktop/       # 桌面应用
│   ├── web/           # Web 应用
│   ├── sdk/           # SDK
│   └── ...
├── package.json
└── README.md
```

### 常用命令

```bash
# 克隆仓库
git clone https://github.com/AlonechatWorkspace/AloneWork-cli.git

# 进入项目目录
cd AloneWork-cli

# 安装依赖
bun install

# 开发模式
bun run dev

# 类型检查
bun run typecheck

# 代码检查
bun run lint
```

## 致谢

本项目基于 [OpenCode](https://github.com/anomalyco/opencode) 开发，感谢原项目团队的杰出工作。

## 许可证

[MIT License](LICENSE)
