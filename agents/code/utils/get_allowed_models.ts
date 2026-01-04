import OpenAI from 'openai';

export const get_allowed_models = async () => {
    try {
        return new OpenAI().models
            .list()
            .then((res) => res.data.map((i) => i.id).sort((a, b) => a.localeCompare(b)))
            .catch((e) => {
                return [];
            });
    } catch (e) {
        console.error(`OPENAI 初始化失败，请添加 
/config openai_api_key sk-your-api-key
/config openai_base_url https://api.openai.com/v1
/config main_model gpt-4`);
        return [];
    }
};
