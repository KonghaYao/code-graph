import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

export interface AppConfig {
    main_model: string;
}

interface Data {
    config: AppConfig;
}

const defaultData: Data = {
    config: {
        main_model: 'claude-sonnet-4-5',
    },
};

const dbPath = '.code-graph.json';
const adapter = new JSONFile<Data>(dbPath);
const db = new Low(adapter, defaultData);

export const initDb = async () => {
    await db.read();
    // If the config is empty or invalid, reset it to default.
    if (!db.data || !db.data.config) {
        db.data = defaultData;
        await db.write();
    }
};

export const getConfig = () => db.data.config;

export const updateConfig = async (newConfig: Partial<AppConfig>) => {
    Object.assign(db.data.config, newConfig);
    await db.write();
};
