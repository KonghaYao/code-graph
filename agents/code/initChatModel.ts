import { ChatOpenAI } from '@langgraph-js/pro';
import { ChatAnthropic } from '@langchain/anthropic';

export const initChatModel = async (mainModel: string, {}) => {
    // 自定义初始化聊天模型的逻辑
    let model;

    if (process.env.MODEL_PROVIDER === 'anthropic') {
        model = new ChatAnthropic({
            model: mainModel,
            streamUsage: true,
            streaming: true,
        });
    } else {
        model = new ChatOpenAI({
            model: mainModel,
            streamUsage: true,
        });
    }

    return model;
};
