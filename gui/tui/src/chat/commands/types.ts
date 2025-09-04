/**
 * 命令系统类型定义
 */

export interface CommandResult {
    /** 是否成功执行 */
    success: boolean;
    /** 结果消息 */
    message?: string;
    /** 是否应该发送消息到聊天 */
    shouldSendMessage?: boolean;
    /** 要发送的消息内容 */
    messageContent?: string;
    /** 是否应该清空输入框 */
    shouldClearInput?: boolean;
}

export interface CommandContext {
    /** 当前用户输入 */
    userInput: string;
    /** 设置用户输入 */
    setUserInput: (input: string) => void;
    /** 发送消息函数 */
    sendMessage: (content: any[], options?: any) => void;
    /** 当前代理 */
    currentAgent?: string;
    /** 聊天客户端 */
    client?: any;
    /** 额外参数 */
    extraParams?: any;
    /** 创建新聊天 */
    createNewChat: () => void;
    /** 更新配置函数 */
    updateConfig?: (config: any) => Promise<void>;
}

export interface CommandDefinition {
    /** 命令名称（不包含 /） */
    name: string;
    /** 命令描述 */
    description: string;
    /** 命令别名 */
    aliases?: string[];
    /** 命令用法示例 */
    usage?: string;
    /** 是否需要参数 */
    requiresArgs?: boolean;
    /** 参数验证函数 */
    validateArgs?: (args: string[]) => boolean;
    /** 命令执行函数 */
    execute: (args: string[], context: CommandContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSuggestion {
    /** 命令名称 */
    command: string;
    /** 匹配的参数 */
    args?: string[];
    /** 显示文本 */
    displayText: string;
    /** 描述 */
    description: string;
}
