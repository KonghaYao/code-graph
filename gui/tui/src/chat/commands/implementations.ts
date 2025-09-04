/**
 * 具体命令实现
 */

import { commandRegistry } from './registry';
import { type CommandDefinition, type CommandResult, type CommandContext } from './types';

/**
 * /init 命令 - 初始化新的对话会话
 */
export const initCommand: CommandDefinition = {
    name: 'init',
    description: '初始化新的对话会话',
    aliases: ['new', 'start'],
    usage: '/init [主题]',
    execute: async (args: string[], context: CommandContext): Promise<CommandResult> => {
        const topic = args.join(' ');

        // 创建新聊天
        context.createNewChat();

        // 如果提供了主题，发送初始化消息
        if (topic) {
            const initMessage = `我想开始一个关于 "${topic}" 的新对话。`;

            setTimeout(() => {
                context.sendMessage(
                    [
                        {
                            type: 'human',
                            content: initMessage,
                        },
                    ],
                    context.extraParams,
                );
            }, 100); // 小延迟确保新聊天创建完成

            return {
                success: true,
                message: `已创建新对话，主题: ${topic}`,
                shouldClearInput: true,
            };
        }

        return {
            success: true,
            message: '已创建新对话',
            shouldClearInput: true,
        };
    },
};

/**
 * /help 命令 - 显示帮助信息
 */
export const helpCommand: CommandDefinition = {
    name: 'help',
    description: '显示命令帮助信息',
    aliases: ['h', '?'],
    usage: '/help [命令名]',
    execute: async (args: string[], context: CommandContext): Promise<CommandResult> => {
        const commandName = args[0];
        const helpText = commandRegistry.getHelp(commandName);

        return {
            success: true,
            message: helpText,
            shouldClearInput: true,
        };
    },
};

/**
 * /clear 命令 - 清空当前输入
 */
export const clearCommand: CommandDefinition = {
    name: 'clear',
    description: '清空当前输入框',
    aliases: ['c'],
    execute: async (args: string[], context: CommandContext): Promise<CommandResult> => {
        return {
            success: true,
            message: '输入框已清空',
            shouldClearInput: true,
        };
    },
};

/**
 * /agent 命令 - 切换代理
 */
export const agentCommand: CommandDefinition = {
    name: 'agent',
    description: '显示或切换当前代理',
    aliases: ['a'],
    usage: '/agent [代理名称]',
    execute: async (args: string[], context: CommandContext): Promise<CommandResult> => {
        if (args.length === 0) {
            // 显示当前代理信息
            const currentAgentName =
                context.client?.availableAssistants.find((a: any) => a.graph_id === context.currentAgent)?.name ||
                '未选择';

            const availableAgents =
                context.client?.availableAssistants.map((a: any) => `  - ${a.name} (${a.graph_id})`).join('\n') ||
                '  无可用代理';

            return {
                success: true,
                message: `当前代理: ${currentAgentName}\n\n可用代理:\n${availableAgents}`,
                shouldClearInput: true,
            };
        }

        // TODO: 实现代理切换逻辑
        return {
            success: false,
            message: '代理切换功能暂未实现',
            shouldClearInput: true,
        };
    },
};

// 导出所有命令
export const builtinCommands: CommandDefinition[] = [initCommand, helpCommand, clearCommand, agentCommand];
