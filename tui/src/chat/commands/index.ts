/**
 * 命令系统入口文件
 */

import { commandRegistry } from './registry';
import { builtinCommands } from './implementations';
import { extendedCommands } from './extended';

// 注册内置命令
[...builtinCommands, ...extendedCommands].forEach((command) => {
    commandRegistry.register(command);
});

export { commandRegistry } from './registry';
export { type CommandResult, type CommandContext, type CommandDefinition, type CommandSuggestion } from './types';
