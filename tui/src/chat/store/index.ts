import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';

export interface AppConfig {
    main_model: string;
    mcp_config?: MCPConfig;
    openai_api_key?: string;
    openai_base_url?: string;
}

export interface MCPConfig {}
interface Data {
    config: AppConfig;
}

const defaultData: Data = {
    config: {
        main_model: 'claude-sonnet-4-5',
    },
};

// 将配置文件存储到用户目录
const userHome = os.homedir();
export const dbPath = path.join(userHome, '.code-graph.json');
const adapter = new JSONFile<Data>(dbPath);
const db = new Low(adapter, defaultData);

export const initDb = async () => {
    await db.read();
    if (!db.data || !db.data.config) {
        db.data = defaultData;
        await db.write();
    }

    // 将配置设置到环境变量
    syncEnvFromConfig();
};

export const getConfig = () => db.data.config;

/**
 * 将配置同步到环境变量
 */
export const syncEnvFromConfig = () => {
    if (db.data.config.openai_api_key) {
        process.env.OPENAI_API_KEY = db.data.config.openai_api_key;
    }
    if (db.data.config.openai_base_url) {
        process.env.OPENAI_BASE_URL = db.data.config.openai_base_url;
    }
};

export const updateConfig = async (newConfig: Partial<AppConfig>) => {
    Object.assign(db.data.config, newConfig);
    await db.write();

    // 同步更新所有环境变量
    syncEnvFromConfig();
};
