/**
 * 扩展命令示例 - 展示如何添加更多命令
 * 这个文件可以作为添加新命令的参考
 */

import { type CommandDefinition } from './types';

/**
 * /status 命令 - 显示系统状态
 */
export const statusCommand: CommandDefinition = {
    name: 'status',
    description: '显示当前聊天状态信息',
    aliases: ['stat', 'info'],
    execute: async (args: string[], context) => {
        const agentInfo = context.client?.availableAssistants.find((a: any) => a.graph_id === context.currentAgent);

        const statusInfo = [
            `当前代理: ${agentInfo?.name || '未选择'} (${context.currentAgent || 'N/A'})`,
            `聊天ID: ${context.client?.currentChatId?.slice(-8) || 'N/A'}`,
            `可用代理数: ${context.client?.availableAssistants?.length || 0}`,
            `模型: ${context.extraParams?.main_model || 'N/A'}`,
        ].join('\n');

        return {
            success: true,
            message: statusInfo,
            shouldClearInput: true,
        };
    },
};

/**
 * /template 命令 - 插入预定义模板
 */
export const templateCommand: CommandDefinition = {
    name: 'template',
    description: '插入预定义的消息模板',
    aliases: ['tpl', 't'],
    usage: '/template <模板名>',
    requiresArgs: true,
    validateArgs: (args: string[]) => args.length > 0,
    execute: async (args: string[], context) => {
        const templateName = args[0];
        const templates: Record<string, string> = {
            bug: '我遇到了一个bug：\n\n**问题描述：**\n\n**重现步骤：**\n1. \n2. \n3. \n\n**期望结果：**\n\n**实际结果：**\n',
            feature: '我需要实现一个新功能：\n\n**功能描述：**\n\n**需求分析：**\n\n**技术要求：**\n',
            review: '请帮我审查这段代码：\n\n```\n// 在这里粘贴代码\n```\n\n**关注点：**\n- 性能\n- 安全性\n- 可维护性\n',
            optimize: '请帮我优化这段代码的性能：\n\n```\n// 在这里粘贴代码\n```\n\n**性能问题：**\n\n**期望改进：**\n',
        };

        const template = templates[templateName];
        if (!template) {
            const availableTemplates = Object.keys(templates).join(', ');
            return {
                success: false,
                message: `未找到模板 "${templateName}"。可用模板: ${availableTemplates}`,
            };
        }

        // 将模板内容设置到输入框
        context.setUserInput(template);

        return {
            success: true,
            message: `已插入模板: ${templateName}`,
            shouldClearInput: false, // 不清空，让用户编辑模板
        };
    },
};

/**
 * 可用模型列表
 */
const AVAILABLE_MODELS = ['claude-sonnet-4', 'gpt-4o-mini', 'gpt-4.1-mini', 'gemini-2.5-pro', 'gemini-2.5-flash'];

/**
 * /model 命令 - 切换模型
 */
export const modelCommand: CommandDefinition = {
    name: 'model',
    description: '显示或切换当前模型',
    aliases: ['m'],
    usage: '/model [模型名]',
    execute: async (args: string[], context) => {
        if (args.length === 0) {
            // 显示当前模型和可用模型列表
            const currentModel = context.extraParams?.main_model || 'N/A';
            const modelList = AVAILABLE_MODELS.map(
                (model, index) => `  ${index + 1}. ${model}${model === currentModel ? ' (当前)' : ''}`,
            ).join('\n');

            return {
                success: true,
                message: `当前模型: ${currentModel}\n\n可用模型:\n${modelList}\n\n使用 /model <模型名> 或 /model <序号> 切换模型`,
                shouldClearInput: true,
            };
        }

        const modelInput = args[0];
        let targetModel: string | undefined;

        // 检查是否为数字序号
        const modelIndex = parseInt(modelInput, 10);
        if (!isNaN(modelIndex) && modelIndex >= 1 && modelIndex <= AVAILABLE_MODELS.length) {
            targetModel = AVAILABLE_MODELS[modelIndex - 1];
        } else {
            // 检查是否为完整模型名或部分匹配
            targetModel = AVAILABLE_MODELS.find(
                (model) => model === modelInput || model.toLowerCase().includes(modelInput.toLowerCase()),
            );
        }

        if (!targetModel) {
            const availableList = AVAILABLE_MODELS.map((model, index) => `  ${index + 1}. ${model}`).join('\n');

            return {
                success: false,
                message: `未找到模型 "${modelInput}"。\n\n可用模型:\n${availableList}`,
                shouldClearInput: true,
            };
        }

        // 执行模型切换
        try {
            if (context.updateConfig) {
                await context.updateConfig({ main_model: targetModel });
                return {
                    success: true,
                    message: `模型已切换到: ${targetModel}`,
                    shouldClearInput: true,
                };
            } else {
                return {
                    success: false,
                    message: '无法访问配置更新功能',
                    shouldClearInput: true,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `模型切换失败: ${error instanceof Error ? error.message : String(error)}`,
                shouldClearInput: true,
            };
        }
    },
};

// 导出扩展命令列表
export const extendedCommands: CommandDefinition[] = [statusCommand, templateCommand, modelCommand];
