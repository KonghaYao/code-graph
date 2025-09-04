/**
 * 扩展命令示例 - 展示如何添加更多命令
 * 这个文件可以作为添加新命令的参考
 */

import { commandRegistry } from './registry';
import { type CommandDefinition } from './types';

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
 * /model 命令 - 切换模型
 */
export const modelCommand: CommandDefinition = {
    name: 'model',
    description: '显示或切换当前模型',
    aliases: ['m'],
    usage: '/model [模型名]',
    execute: async (args: string[], context) => {
        if (args.length === 0) {
            return {
                success: true,
                message: `当前模型: ${context.extraParams?.main_model || 'N/A'}`,
                shouldClearInput: true,
            };
        }
        return {
            success: false,
            message: '模型切换功能暂未实现',
            shouldClearInput: true,
        };
    },
};

// 导出扩展命令列表
export const extendedCommands: CommandDefinition[] = [templateCommand, modelCommand];
