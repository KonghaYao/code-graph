import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = path.join(homedir(), '.code-graph');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface AppConfig {
    apiUrl: string;
    agentName: string;
}

const defaultConfig: AppConfig = {
    apiUrl: 'http://localhost:8123',
    agentName: 'code',
};

export async function readConfig(): Promise<AppConfig> {
    try {
        const fileContent = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // Config file not found, create default config
            await ensureConfigDirExists();
            await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
            return defaultConfig;
        }
        console.error('Failed to read config file:', error);
        return defaultConfig;
    }
}

export async function writeConfig(config: AppConfig): Promise<void> {
    try {
        await ensureConfigDirExists();
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to write config file:', error);
    }
}

async function ensureConfigDirExists(): Promise<void> {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create config directory:', error);
    }
}
