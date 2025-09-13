import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, ToolMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { tool, DynamicStructuredTool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';

/**
 * 子代理配置接口
 */
export interface SubAgentConfig {
    /** 代理名称 */
    name: string;
    /** 代理描述 */
    description: string;
    /** 语言模型实例 */
    llm: BaseChatModel;
    /** 系统提示词 */
    systemPrompt: string;
    /** 可用工具列表 */
    tools: DynamicStructuredTool[];
    /** 最大执行时间（毫秒），默认 30 秒 */
    maxExecutionTime?: number;
    /** 最大消息数量，防止无限循环，默认 50 */
    maxMessages?: number;
}

/**
 * 任务输入结构
 */
export const TaskInputSchema = z.object({
    task_name: z.string().min(1).describe('任务名称，简洁明确'),
    task_description: z.string().min(1).describe('任务的详细描述，包含具体要求和预期结果'),
    context_detail: z.string().optional().describe('相关上下文信息，可选'),
    additional_instructions: z.string().optional().describe('额外的执行指令，可选'),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

/**
 * 任务完成工具
 */
const createFinishTaskTool = () =>
    tool(
        async ({ result, summary }) => {
            return JSON.stringify({ result, summary, completed: true });
        },
        {
            name: 'finish_task',
            description: '完成任务并返回结果。当任务成功完成时使用此工具。',
            schema: z.object({
                result: z.string().min(1).describe('任务执行的具体结果'),
                summary: z.string().optional().describe('任务执行的简要总结'),
            }),
            returnDirect: true,
        },
    );
/**
 * 执行元数据接口
 */
interface ExecutionMetadata {
    success: boolean;
    error?: string;
    executionTime: number;
    messageCount: number;
}

/**
 * 创建子代理工具
 */
export const createSubAgentTool = (config: SubAgentConfig) => {
    // 参数验证
    if (!config.name || !config.description || !config.llm || !config.systemPrompt) {
        throw new Error('SubAgentConfig 缺少必要参数');
    }

    const finishTaskTool = createFinishTaskTool();
    const maxExecutionTime = config.maxExecutionTime || 30000; // 30秒
    const maxMessages = config.maxMessages || 50;

    return tool(
        async (input: TaskInput): Promise<string> => {
            const startTime = Date.now();

            try {
                // 输入验证
                const validatedInput = TaskInputSchema.parse(input);

                // 创建代理实例
                const agent = createReactAgent({
                    llm: config.llm,
                    prompt: buildSystemPrompt(config.systemPrompt, validatedInput),
                    tools: [...config.tools, finishTaskTool],
                });

                // 构建初始消息
                const initialMessages = buildInitialMessages(validatedInput);

                // 执行任务（带超时控制）
                const executionPromise = agent.invoke({
                    messages: initialMessages,
                });

                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('任务执行超时')), maxExecutionTime);
                });

                const result = await Promise.race([executionPromise, timeoutPromise]);
                const executionTime = Date.now() - startTime;

                // 验证消息数量
                if (result.messages.length > maxMessages) {
                    console.warn(`子代理消息数量超过限制: ${result.messages.length}/${maxMessages}`);
                }

                // 处理执行结果
                return handleExecutionResult(result, {
                    success: true,
                    executionTime,
                    messageCount: result.messages.length,
                });
            } catch (error) {
                const executionTime = Date.now() - startTime;
                console.error(`子代理 ${config.name} 执行失败:`, error);

                return handleExecutionResult(null, {
                    success: false,
                    error: error instanceof Error ? error.message : '未知错误',
                    executionTime,
                    messageCount: 0,
                });
            }
        },
        {
            name: config.name,
            description: config.description,
            schema: TaskInputSchema,
        },
    );
};

/**
 * 构建系统提示词
 */
function buildSystemPrompt(basePrompt: string, input: TaskInput): string {
    return `${basePrompt}

## 当前任务信息
- **任务名称**: ${input.task_name}
- **任务描述**: ${input.task_description}
${input.context_detail ? `- **上下文信息**: ${input.context_detail}` : ''}
${input.additional_instructions ? `- **额外指令**: ${input.additional_instructions}` : ''}

## 执行要求
1. 仔细分析任务需求，确保理解正确
2. 使用提供的工具完成任务
3. 任务完成后，必须使用 finish_task 工具返回结果
4. 如遇到问题，请详细说明并尝试解决方案

请开始执行任务。`;
}

/**
 * 构建初始消息
 */
function buildInitialMessages(input: TaskInput): BaseMessage[] {
    const messages: BaseMessage[] = [
        new HumanMessage(`请执行以下任务：

**任务名称**: ${input.task_name}
**任务描述**: ${input.task_description}

${input.context_detail ? `**相关上下文**: ${input.context_detail}\n` : ''}${
            input.additional_instructions ? `**额外说明**: ${input.additional_instructions}\n` : ''
        }
请仔细分析任务需求，使用可用的工具完成任务，并在完成后使用 finish_task 工具返回结果。`),
    ];

    return messages;
}

/**
 * 处理执行结果，返回简洁的 markdown 格式
 */
function handleExecutionResult(agentResult: any, metadata: ExecutionMetadata): string {
    // 处理执行失败的情况
    if (!metadata.success) {
        return `## ❌ 任务执行失败

**错误信息**: ${metadata.error}

**执行时间**: ${metadata.executionTime}ms`;
    }

    // 检查代理是否返回了消息
    if (!agentResult || !agentResult.messages || agentResult.messages.length === 0) {
        return `## ❌ 任务执行异常

**问题**: 代理未返回任何消息

**执行时间**: ${metadata.executionTime}ms`;
    }

    const lastMessage = agentResult.messages[agentResult.messages.length - 1];

    // 处理工具消息（优先处理 finish_task）
    if (lastMessage.getType() === 'tool') {
        const toolMessage = lastMessage as ToolMessage;

        if (toolMessage.name === 'finish_task') {
            try {
                const toolResult = JSON.parse(toolMessage.content as string);
                return formatTaskResult(toolResult.result, toolResult.summary, metadata);
            } catch (parseError) {
                return formatTaskResult(toolMessage.content as string, undefined, metadata);
            }
        }

        // 其他工具消息
        console.warn(`子代理返回了非预期的工具消息: ${toolMessage.name}`);
        return formatTaskResult(toolMessage.content as string, undefined, metadata, '⚠️ 任务未正常完成');
    }

    // 处理 AI 消息
    if (lastMessage.getType() === 'ai') {
        const aiMessage = lastMessage as AIMessage;
        return formatTaskResult(aiMessage.content as string, undefined, metadata, '⚠️ 任务未使用完成工具');
    }

    // 处理其他类型的消息
    console.warn('子代理返回了未知类型的消息:', lastMessage.getType());
    return formatTaskResult(lastMessage.content as string, undefined, metadata, '⚠️ 未知消息类型');
}

/**
 * 格式化任务结果为 markdown
 */
function formatTaskResult(
    result: string,
    summary?: string,
    metadata?: ExecutionMetadata,
    statusPrefix: string = '✅ 任务完成',
): string {
    let markdown = `## ${statusPrefix}\n\n`;

    // 添加摘要（如果有）
    if (summary && summary.trim()) {
        markdown += `**摘要**: ${summary}\n\n`;
    }

    // 添加主要结果
    markdown += `${result}`;

    // 添加执行信息（简化版）
    if (metadata) {
        markdown += `\n\n---\n*执行时间: ${metadata.executionTime}ms | 消息数: ${metadata.messageCount}*`;
    }

    return markdown;
}
