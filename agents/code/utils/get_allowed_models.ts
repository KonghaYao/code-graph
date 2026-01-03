import OpenAI from 'openai';

export const get_allowed_models = () => {
    return new OpenAI().models
        .list()
        .then((res) => res.data.map((i) => i.id))
        .catch((e) => {
            console.error('OPENAI 初始化失败，请添加 OPENAI_API_KEY，OPENAI_BASE_URL 到环境变量');
            throw e;
        });
};
