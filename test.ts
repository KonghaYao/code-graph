import { rgPath } from '@vscode/ripgrep';
import { execa } from 'execa';
import path from 'path';

async function searchAgentsFolder() {
    const agentsPath = path.join(process.cwd(), 'agents');

    console.log('开始搜索 agents 文件夹中的 TypeScript 文件...');
    console.log('ripgrep 路径:', rgPath);
    console.log('搜索目录:', agentsPath);

    try {
        const result = await execa(
            rgPath,
            [
                'graph', // 强制行缓冲，避免输出被缓存
                agentsPath, // 搜索目录
            ],
            {
                cwd: process.cwd(),
                timeout: 30000, // 30秒超时
                reject: false, // 不要在非零退出码时抛出异常
                stripFinalNewline: false, // 保留原始输出格式
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, FORCE_COLOR: '0' }, // 确保禁用颜色输出
            },
        );

        if (result.exitCode === 0) {
            const files = result.stdout
                .trim()
                .split('\n')
                .filter((file) => file.length > 0);

            console.log(`\n搜索完成！总共找到 ${files.length} 个 TypeScript 文件:`);
            files.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });

            return files;
        } else {
            console.error('搜索失败:', result.stderr);
            throw new Error(`ripgrep 退出码: ${result.exitCode}, 错误: ${result.stderr}`);
        }
    } catch (error) {
        console.error('执行 ripgrep 失败:', error);
        throw error;
    }
}

// 执行搜索
searchAgentsFolder()
    .then((files) => {
        console.log('\n✅ 搜索任务完成！');
    })
    .catch((error) => {
        console.error('❌ 搜索出错:', error);
        process.exit(1);
    });
