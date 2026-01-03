import { createMiddleware, HumanMessage, SystemMessage } from 'langchain';
import { add_memory_tool, query_memory_tool } from '../tools/memory/memory_tool';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import z from 'zod';
import { MemoryEntrySchema, MemoryStorage } from '../tools/memory/storage_layer';
import { AgentState } from '@langgraph-js/pro';

export const MemoryState = AgentState.extend({
    initMessageCount: z.number().default(0),
});

export const summary_prompt = `你是一个负责管理记忆的 agent，你需要将最近的对话总结为多个独立的记忆片段，每个片段应该是一个具体、可检索的知识点。

## 记忆片段要求

每个记忆片段必须包含：
1. 具体的技术实现细节（包含简短的代码示例）
2. 关键文件或文件夹的位置和用途
3. 用户的明确请求和你的解决方案
4. 遇到的错误及修复方法
5. 重要的架构决策或代码模式

记忆片段应该：
- 独立完整，能够单独理解
- 包含足够的上下文信息
- 使用具体的文件名、函数名、代码片段
- 便于后续通过关键词检索

## 分析过程

在提供最终总结之前，请按时间顺序分析对话的每条消息和每个部分。对于每个部分，彻底识别：
- 用户的明确请求和意图
- 你处理用户请求的方法
- 关键决策、技术概念和代码模式
- 具体细节：文件名、完整代码片段、函数签名、文件编辑
- 你遇到的错误以及如何修复它们
- 特别注意你收到的具体用户反馈，尤其是用户告诉你以不同方式做某事时

## 记忆片段内容指南

你的总结应包括以下类型的记忆片段：

1. **主要请求和意图**：详细捕捉用户的所有明确请求和意图
2. **关键技术概念**：列出所有讨论过的重要技术概念、技术和框架
3. **文件和代码部分**：列举检查、修改或创建的具体文件和代码部分，包含完整的代码片段和为什么此文件很重要的说明
4. **错误和修复**：列出你遇到的所有错误以及如何修复它们，包括用户的反馈
5. **问题解决**：记录已解决的问题和任何正在进行的故障排除工作
6. **架构决策**：记录重要的架构决策和代码模式

## 示例记忆片段

"在 agents/code/tools/memory/storage_layer.ts 中实现了基于向量的记忆存储，使用 embeddings 进行语义检索，关键代码：\`\`\`typescript
await this.vectorStore.search(query, topK)
\`\`\`"

"用户请求翻译 summary_prompt 为中文，已完成翻译并保持了原有的结构和格式，包括所有标签和示例。文件位置：agents/code/middlewares/memory.ts"

"修复了记忆总结提示词，将其从简短描述改为详细的结构化指南，包含了每个记忆片段应该包含的具体内容和质量要求"

## 记忆冲突处理原则

在创建新记忆时，必须遵循以下冲突解决原则：

1. **以用户为主**：
   - 用户的明确指示和反馈优先级最高
   - 如果用户纠正了你的理解或做法，以用户的说法为准
   - 用户的偏好设置和要求必须被准确记录

2. **以最新为主**：
   - 对于同一主题的信息，最新的对话内容优先
   - 如果用户修改了之前的决策，记录最新的决策
   - 技术实现如果发生变更，记录最新的实现方式

3. **避免重复记忆**：
   - 检查即将创建的记忆是否与已有记忆重复
   - 如果内容相似或重复，不予记录
   - 如果是对已有记忆的更新或补充，需要明确说明是更新内容
   - 只有当信息有实质性差异或新增价值时才创建新记忆

4. **冲突解决示例**：
   - ❌ 错误：同时记录"使用方案A"和"使用方案B"
   - ✅ 正确：只记录"用户决定使用方案B（替代之前的方案A）"
   - ❌ 错误：重复记录"文件位置在 /path/to/file"
   - ✅ 正确：只记录一次，或在有新信息时说明"文件移动到新位置 /new/path"

## 注意事项

- 仔细检查技术准确性和完整性
- 确保每个记忆片段都是独立的、完整的
- 包含足够的代码示例和文件路径
- 记录用户的反馈和你的调整
- 应用记忆冲突处理原则，避免创建冲突或重复的记忆
`;

export const MemoryMiddleware = (model: BaseChatModel) => {
    return createMiddleware({
        name: 'MemoryMiddleware',
        tools: [add_memory_tool, query_memory_tool],
        stateSchema: MemoryState,
        beforeAgent(state: z.infer<typeof MemoryState>) {
            state.initMessageCount = state?.messages?.length || 0;
        },
        async afterAgent(state: z.infer<typeof MemoryState>) {
            if (state.messages.length - state.initMessageCount >= 10) {
                try {
                    const memory = await model
                        .withStructuredOutput(
                            z.object({
                                memories: z.array(MemoryEntrySchema.omit({ timestamp: true })),
                            }),
                        )
                        .invoke([
                            new SystemMessage(summary_prompt),
                            ...state.messages,
                            new HumanMessage(
                                '请开始总结最近的一次对话内容为几段记忆，注意：最近对话之前的内容已经被记录了，请专注于总结最近的对话。',
                            ),
                        ]);
                    const storage = new MemoryStorage();
                    await Promise.all(
                        memory.memories.map((i) => storage.add({ ...i, timestamp: new Date().toISOString() })),
                    );
                    console.log(memory.memories.length, ' 条记忆添加成功');
                } catch (e) {
                    console.log('记忆总结失败', e);
                }
            }
        },
    });
};
