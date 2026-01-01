# Code Graph TUI

一个基于 React + Ink 构建的现代化终端用户界面（TUI）聊天应用，专为 AI 代码助手设计。支持 LangGraph 协议，提供丰富的命令系统、历史记录管理和实时 token 统计功能。

## 项目结构

```
tui/
├── src/
│   ├── app.tsx                    # 应用入口点，渲染主组件
│   ├── index.ts                   # 主要导出文件
│   ├── hooks/                     # React Hooks
│   │   └── useWindowSize.ts       # 窗口尺寸监控 Hook
│   ├── utils/                     # 工具函数
│   │   ├── tokenUsage.ts          # Token 使用量计算和格式化
│   │   └── user.ts                # 获取当前系统用户信息
│   └── chat/                      # 聊天核心模块
│       ├── Chat.tsx               # 主聊天组件，处理界面布局和状态
│       ├── AgentOptions.tsx       # Agent 选择面板
│       ├── context/               # React Context
│       │   └── SettingsContext.tsx # 设置状态管理
│       ├── store/                 # 数据持久化
│       │   └── index.ts           # 配置存储 (LowDB)
│       ├── components/            # UI 组件
│       │   ├── WelcomeHeader.tsx  # 欢迎界面头部
│       │   ├── MessageBox.tsx     # 消息容器
│       │   ├── MessageHuman.tsx   # 用户消息组件
│       │   ├── MessageAI.tsx      # AI 消息组件
│       │   ├── MessageTool.tsx    # 工具调用消息组件
│       │   ├── Markdown.tsx       # Markdown 渲染器
│       │   ├── UsageMetadata.tsx  # Token 使用统计显示
│       │   ├── TokenProgressBar.tsx # Token 进度条
│       │   ├── CommandHandler.tsx # 命令处理组件
│       │   ├── HistoryList.tsx    # 历史记录列表
│       │   ├── SettingsPanel.tsx  # 设置面板
│       │   └── WelcomeHeader.tsx  # 欢迎界面
│       ├── commands/              # 命令系统
│       │   ├── types.ts           # 命令类型定义
│       │   ├── registry.ts        # 命令注册和管理器
│       │   ├── implementations.ts # 内置命令实现
│       │   ├── extended.ts        # 扩展命令实现
│       │   └── index.ts           # 命令系统入口
│       ├── tools/                 # 工具模块 (空)
│       └── FileUpload/            # 文件上传 SDK
│           └── index.ts           # 文件上传客户端
├── package.json                   # 项目依赖和脚本
└── dist/                          # 构建输出目录
```

## 核心技术栈

### 前端框架
- **React 19.1.1** - UI 组件化框架
- **Ink 6.2.3** - React 的终端 UI 框架
- **@inkjs/ui 2.0.0** - Ink 组件库

### 状态管理
- **@nanostores/react 1.0.0** - 轻量级状态管理
- **@langgraph-js/sdk 4.3.6** - LangGraph SDK，提供聊天状态管理

### 数据持久化
- **lowdb 7.0.1** - 轻量级本地 JSON 数据库

### 渲染和格式化
- **marked 16.2.1** - Markdown 解析器
- **marked-terminal 7.3.0** - 终端 Markdown 渲染
- **ink-markdown 1.0.4** - Ink Markdown 组件
- **ink-syntax-highlight 2.0.2** - 代码语法高亮

### UI 组件
- **ink-text-input 6.0.0** - 文本输入组件
- **ink-select-input 6.2.0** - 选择输入组件
- **ink-spinner 5.0.0** - 加载动画组件

### 工具库
- **comlink 4.4.2** - Web Workers 通信库

### 开发依赖
- **@babel/cli 7.21.0** - Babel 命令行工具
- **@babel/preset-react 7.18.6** - React Babel 预设
- **@types/react 19.1.12** - React 类型定义
- **@types/marked-terminal 6.1.1** - marked-terminal 类型定义
- **react-devtools-core 6.1.5** - React 开发工具

## 关键逻辑

### 1. 应用初始化流程
```
SettingsProvider → ChatProvider → Chat → AppProviders
```
- 配置加载：从 `.code-graph.json` 读取配置
- 数据库初始化：LowDB 初始化
- 聊天客户端：LangGraph SDK 客户端初始化

### 2. 聊天状态管理
- **ChatProvider**：管理聊天历史、当前对话、加载状态
- **SettingsContext**：管理应用配置（API URL、Agent 名称、模型）
- **命令系统**：通过 `/` 前缀触发特殊命令

### 3. 命令系统架构
```typescript
// 命令注册
CommandRegistry.register(commandDefinition)

// 命令执行流程
1. 检测输入是否以 `/` 开头
2. 解析命令和参数
3. 验证参数
4. 执行命令函数
5. 返回结果（成功/失败消息）
```

**内置命令：**
- `/init` - 创建新对话
- `/help` - 显示帮助信息
- `/clear` - 清空输入框
- `/init-agent-md` - 初始化文档编写 Agent

**扩展命令：**
- `/status` - 显示系统状态
- `/template` - 插入消息模板
- `/model` - 切换 AI 模型

### 4. 消息渲染系统
- **MessageHuman**：用户消息，绿色边框，显示用户名
- **MessageAI**：AI 回复，显示模型名称和 Token 统计
- **MessageTool**：工具调用，支持折叠/展开，JSON 格式化显示
- **Markdown**：使用 marked + marked-terminal 渲染 Markdown

### 5. Token 使用监控
```typescript
// 计算逻辑
MAX_TOKENS = 256K (默认)
MAX_TOKENS_EXTENDED = 1M (扩展)

// 显示组件
<TokenProgressBar currentTokens={tokens} />
```

### 6. 键盘快捷键系统
**命令模式 (ESC 切换)：**
- `a` - 切换到 Agent 模式
- `h` - 打开历史记录
- `s` - 打开设置
- `g` - 选择 Agent
- `n` - 新建对话
- `^C` - 退出应用

**Agent 模式：**
- `ESC` - 切换到命令模式

### 7. 数据持久化
```typescript
// 配置存储在 .code-graph.json
{
  "apiUrl": "http://127.0.0.1:8123",
  "agentName": "code",
  "main_model": "claude-sonnet-4",
  "activeAgent": "code"
}
```

### 8. 文件上传 SDK
提供 `TmpFilesClient` 用于文件上传到 tmpfiles.org 服务，支持：
- Blob/File/String 输入
- 进度控制（AbortSignal）
- 响应处理和 URL 转换

## 使用方法

### 安装依赖
```bash
pnpm install
```

### 开发运行
```bash
bun run src/app.tsx
```

### 构建
```bash
# 项目配置了 bin 字段指向 dist/app.js
# 需要先构建 TypeScript
```

## 特色功能

1. **实时 Token 统计**：显示输入/输出 token 数量和使用百分比
2. **命令自动补全**：输入 `/` 后显示命令建议
3. **历史记录管理**：浏览和切换历史对话
4. **多 Agent 支持**：动态加载和切换不同 Agent
5. **模板系统**：快速插入预定义消息模板
6. **语法高亮**：工具调用和代码块的语法高亮显示
7. **响应式布局**：自适应终端窗口大小

## 配置说明

应用启动时会自动创建 `.code-graph.json` 配置文件：

```json
{
  "apiUrl": "http://127.0.0.1:8123",  // LangGraph API 地址
  "agentName": "code",                 // 默认 Agent 名称
  "main_model": "claude-sonnet-4"     // 默认使用的 AI 模型
}
```

通过设置面板（`s` 键）可以实时修改这些配置。

## 扩展开发

### 添加新命令
在 `src/chat/commands/extended.ts` 中添加：

```typescript
export const newCommand: CommandDefinition = {
    name: 'command-name',
    description: '命令描述',
    aliases: ['alias'],
    execute: async (args, context) => {
        // 实现逻辑
        return {
            success: true,
            message: '执行成功',
            shouldClearInput: true
        };
    }
};
```

### 添加新组件
在 `src/chat/components/` 目录下创建新组件，使用 Ink 的组件 API。

### 修改主题颜色
在 `src/chat/components/` 中的各个组件中修改 `Text` 组件的 `color` 属性。

## 注意事项

1. **Bun 运行时**：项目使用 Bun 作为运行时，确保已安装 Bun
2. **LangGraph 服务**：需要运行 LangGraph 服务端（默认端口 8123）
3. **终端兼容性**：建议在支持 Unicode 和 256 色的终端中使用
4. **配置文件权限**：确保有权限在当前目录创建 `.code-graph.json`

## 项目依赖关系

```
tui
├── @langgraph-js/sdk (核心聊天功能)
├── ink (终端 UI 框架)
├── react (组件化)
├── lowdb (配置持久化)
├── marked (Markdown 渲染)
└── 各种 Ink 组件 (UI 交互)
```

## 许可证

ISC