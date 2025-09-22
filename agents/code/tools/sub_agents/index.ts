import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ToolMessage, AIMessage } from '@langchain/core/messages';
import { tool, DynamicStructuredTool } from '@langchain/core/tools';
import { Annotation, AnnotationRoot, Command, getCurrentTaskInput } from '@langchain/langgraph';
import { createReactAgent, createReactAgentAnnotation } from '@langchain/langgraph/prebuilt';
import { createDefaultAnnotation, createState } from '@langgraph-js/pro';
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
    /** 状态模式 */
    stateSchema?: AnnotationRoot<any>;
    /**
     * 额外数据格式, 当大模型触发进入 sub-agent 的时候，携带的额外数据格式
     * 默认不携带，或者为一个字符串
     */
    additionalDataFormat?: z.ZodType<any>;
    /**
     * 响应格式，sub-agent 返回数据给主 agent 时，所携带的数据
     * 默认为 z.string(), 返回一段文本给主 agent
     */
    responseFormat?: z.ZodType<any>;
}

/**
 * 任务完成工具
 */
const createFinishTaskTool = (config: { responseFormat?: z.ZodType<any> }) =>
    tool(
        async ({ result, summary }) => {
            return JSON.stringify({ result, summary, completed: true });
        },
        {
            name: 'finish_task',
            description:
                'Finish the task and return the result. Use this tool when the task is successfully completed.',
            schema: z.object({
                result: config.responseFormat || z.string().describe('The specific result of the task execution'),
                summary: z
                    .string()
                    .optional()
                    .describe('Details of what you did during this task execution and the outcome'),
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
}

export const MainAgentState = createState().build({
    task_store: Annotation<Record<string, any>>({
        reducer: (x, y) => {
            return {
                ...x,
                ...y,
            };
        },
        default: () => ({}),
    }),
});

const createSubAgentStateSchema = <T extends AnnotationRoot<any>>(stateSchema?: T) => {
    const SubAgentState = createState().build({
        runId: createDefaultAnnotation(() => 0),
    });
    if (!stateSchema) {
        return createState(createReactAgentAnnotation(), SubAgentState).build({});
    }
    return createState(createReactAgentAnnotation(), SubAgentState, stateSchema).build({});
};
/**
 * 创建子代理工具
 */
export const createSubAgentTool = (config: SubAgentConfig) => {
    // 参数验证
    if (!config.name || !config.description || !config.llm || !config.systemPrompt) {
        throw new Error('SubAgentConfig 缺少必要参数');
    }
    const stateSchema = config.stateSchema ? createSubAgentStateSchema(config.stateSchema) : undefined;
    const finishTaskTool = createFinishTaskTool({ responseFormat: config.responseFormat });

    const executeTaskTool = tool(
        async (input, taskConfig) => {
            const toolCallId = taskConfig.toolCall?.id;
            const mainState: typeof MainAgentState.State = getCurrentTaskInput();
            const lastContext = input.task_id && mainState.task_store[input.task_id];
            const currentTaskId = input.task_id || toolCallId;
            try {
                // 创建代理实例
                const agent = createReactAgent({
                    /** 标记不同的名称，给前端进行区别 */
                    name: 'subagent_' + toolCallId,
                    llm: config.llm,
                    prompt:
                        config.systemPrompt +
                        `
## Current Task Information
- **Task Name**: ${input.task_name}
- **Task Description**: ${input.task_description}
${input.context_detail ? `- **Context Information**: ${input.context_detail}` : ''}

## Execution Requirements
1. Carefully analyze the task requirements to ensure correct understanding
2. Use the provided tools to complete the task
3. After completing the task, you must use the finish_task tool to return the result
4. If you encounter any issues, please describe them in detail and try to provide solutions

Please start executing the task.`,
                    tools: [...config.tools, finishTaskTool],
                    stateSchema,
                });

                const result = await agent.invoke(
                    lastContext ?? {
                        messages: [],
                    },
                );

                // 处理执行结果
                const resultStr = handleExecutionResult(result, {
                    success: true,
                });
                return new Command({
                    update: {
                        task_store: {
                            [currentTaskId]: result,
                        },
                        messages: [
                            new ToolMessage({
                                content:
                                    resultStr +
                                    `
---

task_id: ${currentTaskId}
`,
                                tool_call_id: toolCallId,
                            }),
                        ],
                    },
                });
            } catch (error) {
                console.error(`子代理 ${config.name} 执行失败:`, error);

                return handleExecutionResult(null, {
                    success: false,
                    error: error instanceof Error ? error.message : '未知错误',
                });
            }
        },
        {
            name: config.name,
            description: config.description,
            schema: z.object({
                task_id: z
                    .string()
                    .describe(
                        'Task ID, generated by the system. If you do not have one, provide an empty string. If not provided, a new task will be created; if provided, the task will be continued.',
                    ),
                task_name: z.string().min(1).describe('Task name, concise and clear'),
                task_description: z
                    .string()
                    .min(1)
                    .describe('Detailed description of the task, including specific requirements and expected results'),
                context_detail: z.string().optional().describe('Relevant contextual information, optional'),
                additional_data:
                    config.additionalDataFormat ||
                    z.string().optional().describe('Additional execution data, optional'),
            }),
        },
    );

    return executeTaskTool;
};

/**
 * 处理执行结果，返回简洁的 markdown 格式
 */
function handleExecutionResult(
    agentResult: ReturnType<typeof createSubAgentStateSchema>['State'] | null,
    metadata: ExecutionMetadata,
): string {
    // 处理执行失败的情况
    if (!metadata.success) {
        return `## ❌ 任务执行失败

**错误信息**: ${metadata.error}`;
    }

    // 检查代理是否返回了消息
    if (!agentResult || !agentResult.messages || agentResult.messages.length === 0) {
        return `## ❌ 任务执行异常

**问题**: 代理未返回任何消息`;
    }

    const lastMessage = agentResult.messages[agentResult.messages.length - 1];

    // 处理工具消息（优先处理 finish_task）
    if (lastMessage.getType() === 'tool') {
        const toolMessage = lastMessage as ToolMessage;

        if (toolMessage.name === 'finish_task') {
            try {
                const toolResult = JSON.parse(toolMessage.content as string);
                return formatTaskResult(toolResult.result, toolResult.summary);
            } catch (parseError) {
                return formatTaskResult(toolMessage.content as string, undefined);
            }
        }

        // 其他工具消息
        console.warn(`子代理返回了非预期的工具消息: ${toolMessage.name}`);
        return formatTaskResult(toolMessage.content as string, undefined, '⚠️ 任务未正常完成');
    }

    // 处理 AI 消息
    if (lastMessage.getType() === 'ai') {
        const aiMessage = lastMessage as AIMessage;
        return formatTaskResult(aiMessage.content as string, undefined, '⚠️ 任务未使用完成工具');
    }

    // 处理其他类型的消息
    console.warn('子代理返回了未知类型的消息:', lastMessage.getType());
    return formatTaskResult(lastMessage.content as string, undefined, '⚠️ 未知消息类型');
}

/**
 * 格式化任务结果为 markdown
 */
function formatTaskResult(result: string, summary?: string, statusPrefix: string = '✅ 任务完成'): string {
    return `## ${statusPrefix}

${summary && summary.trim() ? `**摘要**: ${summary}\n\n` : ''}${result}`;
}
