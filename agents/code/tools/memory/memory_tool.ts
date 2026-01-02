import { tool, ToolRuntime } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * 添加记忆到记忆文件中
 */
export const add_memory_tool = tool(
    async ({ title, details, example }, runtime: ToolRuntime) => {
        try {
            const memoryDir = path.join(process.cwd(), '.langgraph_api');
            const memoryFile = path.join(memoryDir, 'memory.md');

            // 确保目录存在
            await fs.mkdir(memoryDir, { recursive: true });

            // 生成当前日期
            const date = new Date().toISOString().split('T')[0];

            // 构建记忆条目
            const memoryEntry = `---

## ${title}

**日期**: ${date}

**会话 ID**: ${
                /** @ts-ignore */
                runtime.config?.thread_id || 'N/A'
            }

### 详细描述
${details}

${example ? `### 示例\n${example}\n` : ''}
`;

            // 追加到文件
            await fs.appendFile(memoryFile, memoryEntry, 'utf-8');

            return `记忆 "${title}" 已成功添加到 ${memoryFile}`;
        } catch (error: any) {
            return `添加记忆时出错: ${error.message}`;
        }
    },
    {
        name: 'add_memory',
        description: `保存重要信息供未来参考。用于记录项目中的关键信息、解决方案或经验。

何时使用：
- 用户要求记住某些信息
- 解决了复杂问题，值得记录供日后参考
- 发现了项目的重要模式或约定
- 需要记录特殊配置或决策的原因

使用建议：
- 将复杂情况简化为清晰的 example（代码片段、命令、配置等）
- example 中展示最核心的用法或解决方案
- details 和 example 都支持 Markdown 格式

查询已有记忆：
- 使用 Read 或 Grep 工具搜索 .langgraph_api/memory.md 文件
- 可以搜索关键词来查找相关的历史记忆`,
        schema: z.object({
            title: z.string().describe('记忆的简短标题，概括主题'),
            details: z.string().describe('详细描述，说明背景和上下文（支持 Markdown）'),
            example: z
                .string()
                .optional()
                .describe('简化的示例，展示核心用法或解决方案（支持 Markdown，建议使用代码块）'),
        }),
    },
);
