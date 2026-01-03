# 记忆模块 - 终极设计文档

> **版本**: v1.0 | **更新时间**: 2026-01-02 | **完成度**: ✅ 100%

---

## 📋 目录

1. [核心概述](#1-核心概述)
2. [完整类型系统](#2-完整类型系统)
3. [工具函数接口](#3-工具函数接口)
4. [执行流程设计](#4-执行流程设计)
5. [执行模式详解](#5-执行模式详解)
6. [错误处理体系](#6-错误处理体系)
7. [配置系统](#7-配置系统)
8. [扩展性架构](#8-扩展性架构)
9. [使用示例](#9-使用示例)
10. [实现路线图](#10-实现路线图)

---

## 1. 核心概述

### 1.1 设计目标

构建一个**智能、可靠、可扩展**的记忆管理系统，在 Agent Loop 执行结束后自动管理记忆的写入、读取和压缩。

**核心特性：**

-   ✅ 智能轮次触发（阈值机制）
-   ✅ AI 驱动的记忆总结（带降级）
-   ✅ 多模式执行（同步/异步/批量/智能）
-   ✅ 完整的错误处理（12 种错误类型）
-   ✅ 灵活的扩展架构（存储抽象/向量化/分层）

### 1.2 核心流程图

```
Agent Loop 结束
    ↓
检查轮次数目 (round_count > 10?)
    ├─ 否 → 结束
    └─ 是 → 继续
        ↓
    选择执行模式
        ├─ 同步模式 → 阻塞等待
        ├─ 异步模式 → 后台处理
        ├─ 批量模式 → 加入队列
        └─ 智能模式 → 自动选择
        ↓
    记忆Agent总结 (AI + 降级)
        ↓
    写入记忆文件
        ↓
    检查行数 (> 500?)
        ├─ 是 → 触发压缩
        └─ 否 → 完成
```

---

## 2. 完整类型系统

### 2.1 核心接口定义

```typescript
// ============================================
// Agent Loop 上下文
// ============================================
interface AgentLoopContext {
    /** 轮次数目 */
    round_count: number;

    /** 完整的任务执行历史 */
    task_history: Array<{
        round: number;
        input: string | object;
        output: string | object;
        thinking?: string;
        status: 'success' | 'failed' | 'partial';
        timestamp: string;
    }>;

    /** 初始输入 */
    initial_input: string | object;

    /** 最终输出 */
    final_output: string | object;

    /** 执行指标 */
    metrics: {
        total_time: number; // 总执行时间(秒)
        error_count: number; // 错误次数
        tokens_used?: number; // token消耗
        memory_usage?: number; // 内存使用(MB)
    };

    /** 使用的工具列表 */
    used_tools: string[];

    /** 执行环境信息 */
    environment: {
        working_dir?: string;
        dependencies?: Record<string, string>;
        node_version?: string;
        [key: string]: any;
    };

    /** 任务元数据 */
    task_metadata?: {
        task_id?: string;
        task_name?: string;
        priority?: number;
        tags?: string[];
    };
}

// ============================================
// 记忆条目
// ============================================
interface MemoryEntry {
    /** 基础信息 */
    id: string; // UUID
    timestamp: string; // ISO 8601
    round_count: number;

    /** 记忆Agent生成的内容 */
    task_type: string; // 任务类型
    input_summary: string; // 输入摘要 (< 100字)
    output_summary: string; // 输出摘要 (< 100字)
    keywords: string[]; // 3-5个关键词
    one_line_summary: string; // 一句话总结
    key_findings: string[]; // 1-3个关键发现
    tags: string[]; // 分类标签
    priority: number; // 1-5分

    /** 元数据 */
    status: 'success' | 'failed' | 'partial';
    execution_time: number; // 执行时间(秒)
    error_count: number; // 错误次数
    used_tools: string[]; // 使用的工具

    /** 压缩状态 */
    compressed: boolean; // 是否已压缩
    original_entries?: string[]; // 被合并的记忆ID列表
}

// ============================================
// 查询条件
// ============================================
interface Query {
    keywords?: string[];
    time_range?: { start: string; end: string };
    task_type?: string;
    min_rounds?: number;
    priority?: number;
    tags?: string[];
    limit?: number;
}

// ============================================
// 配置接口
// ============================================
interface MemoryConfig {
    /** 文件配置 */
    file_path: string;
    max_lines: number;

    /** 轮次配置 */
    round_threshold: number;

    /** 压缩配置 */
    compress_lines: number;
    auto_compress: boolean;
    compression_ratio: number;

    /** 记忆Agent配置 */
    agent_model: string;
    timeout: number;
    retry_times: number;
    fallback_enabled: boolean;

    /** 隐私配置 */
    privacy_level?: 'low' | 'medium' | 'high';

    /** 性能配置 */
    cache_enabled?: boolean;
    async_mode?: boolean;
}

// ============================================
// 结果类型
// ============================================
interface WriteResult {
    success: boolean;
    message?: string;
    lines_before?: number;
    lines_after?: number;
    position?: number;
    memory_id?: string;
}

interface CompressResult {
    success: boolean;
    message?: string;
    lines_before: number;
    lines_after: number;
    compressed_entries: number;
    merged_count: number;
    strategy_used: string;
    affected_memory_ids: string[];
}

// ============================================
// 错误类型
// ============================================
enum MemoryErrorType {
    // 写入错误
    WRITE_FAILED = 'WRITE_FAILED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    DISK_FULL = 'DISK_FULL',

    // 读取错误
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    PARSE_FAILED = 'PARSE_FAILED',

    // 压缩错误
    COMPRESS_FAILED = 'COMPRESS_FAILED',
    MEMORY_OVERFLOW = 'MEMORY_OVERFLOW',

    // Agent错误
    AGENT_SUMMARY_FAILED = 'AGENT_SUMMARY_FAILED',
    AI_TIMEOUT = 'AI_TIMEOUT',
    AI_FORMAT_ERROR = 'AI_FORMAT_ERROR',

    // 配置错误
    INVALID_CONFIG = 'INVALID_CONFIG',

    // 文件损坏
    CORRUPTED_FILE = 'CORRUPTED_FILE',
}

interface MemoryError extends Error {
    type: MemoryErrorType;
    message: string;
    original_error?: any;
    retryable?: boolean;
    timestamp: string;
}

interface ErrorLog {
    timestamp: string;
    type: MemoryErrorType;
    message: string;
    details?: any;
    stack?: string;
    context?: Partial<AgentLoopContext>;
}
```

### 2.2 AI 响应类型

```typescript
// AI模型响应（完整版）
interface AIModelResponse {
    task_type: string;
    input_summary: string;
    output_summary: string;
    keywords: string[];
    one_line_summary: string;
    key_findings: string[];
    tags: string[];
    priority: number;
}

// 降级策略响应（最小版）
interface FallbackResponse {
    task_type: string;
    input_summary: string;
    output_summary: string;
    keywords: string[];
    tags: string[];
}
```

---

## 3. 工具函数接口

### 3.1 核心工具（4 个）

```typescript
/**
 * 记忆Agent - 负责总结Agent Loop上下文为结构化记忆条目
 * @param context Agent Loop执行上下文
 * @returns 格式化的记忆条目
 * @throws 当AI调用失败且降级策略也失败时
 */
function summarize_to_memory(context: AgentLoopContext): Promise<MemoryEntry>;

/**
 * 写入记忆条目到文件
 * @param entry 由记忆Agent生成的记忆条目
 * @returns 写入结果
 * @throws 当文件操作失败时
 */
function write_memory(entry: MemoryEntry): Promise<WriteResult>;

/**
 * 根据查询条件读取记忆
 * @param query 查询条件
 * @returns 匹配的记忆条目列表
 */
function read_memory(query: Query): Promise<MemoryEntry[]>;

/**
 * 压缩记忆文件到指定行数
 * @param threshold 目标行数阈值
 * @returns 压缩结果
 * @throws 当压缩失败时
 */
function compress_memory(threshold: number): Promise<CompressResult>;
```

### 3.2 配置和辅助工具（3 个）

```typescript
/**
 * 获取或设置记忆模块配置
 * @param partial_config 可选的部分配置更新
 * @returns 当前配置
 */
function get_memory_config(partial_config?: Partial<MemoryConfig>): MemoryConfig;

/**
 * 检查是否应该记录记忆
 * @param context Agent Loop上下文
 * @returns 是否应该记录
 */
function should_record_memory(context: AgentLoopContext): boolean;

/**
 * 获取当前记忆文件行数
 * @returns 当前行数
 */
function get_memory_line_count(): Promise<number>;
```

### 3.3 执行模式工具

```typescript
// 同步模式
function sync_mode(context: AgentLoopContext): Promise<void>;

// 异步模式
function async_mode(context: AgentLoopContext): Promise<void>;

// 智能模式
function smart_mode(context: AgentLoopContext): Promise<void>;
```

### 3.4 错误处理工具

```typescript
// 统一错误处理包装器
function with_error_handling<T>(
    operation: () => Promise<T>,
    error_handler: (error: any) => Promise<T>,
    context?: string,
): Promise<T>;

// Agent失败降级
function handle_agent_failure(context: AgentLoopContext, error: any): Promise<MemoryEntry>;

// 写入失败处理
function handle_write_failure(entry: MemoryEntry, error: any): Promise<WriteResult>;

// 压缩失败处理
function handle_compress_failure(error: any): Promise<CompressResult>;

// 错误日志记录
function log_error(error: MemoryError | ErrorLog): Promise<void>;

// 带指数退避的重试
function retry_with_backoff<T>(fn: () => Promise<T>, max_retries?: number): Promise<T>;
```

### 3.5 辅助工具

```typescript
// 检查记忆文件完整性
function check_memory_integrity(): Promise<{ is_valid: boolean; errors: string[] }>;

// 创建备份
function create_backup(): Promise<{ success: boolean; backup_path: string }>;

// 重试缓存的记忆
function retry_cached_memories(): Promise<void>;

// 启动检查
function startup_check(): Promise<{ healthy: boolean; action?: string }>;

// 获取错误统计
function get_error_stats(): Promise<{
    total: number;
    by_type: Record<MemoryErrorType, number>;
    recent: ErrorLog[];
}>;
```

---

## 4. 执行流程设计

### 4.1 记忆写入流程

```
Agent Loop 执行结束
    ↓
检查执行轮次数目
    ↓
轮次数目 > 10？
    ├─ 否 → 结束（不进行记忆）
    └─ 是 → 继续
        ↓
    触发记忆写入事件
        ↓
    调用记忆Agent进行总结
        ↓
    写入记忆文件
        ↓
    检查记忆文件行数 > 阈值？
        ├─ 是 → 触发记忆压缩
        └─ 否 → 结束
```

### 4.2 记忆压缩流程

```
触发压缩
    ↓
读取全部记忆内容
    ↓
分析记忆结构和语义
    ↓
识别关键信息和重复内容
    ↓
生成压缩策略
    ↓
执行压缩（合并/摘要/删除）
    ↓
写入压缩后内容
    ↓
验证行数 <= 指定阈值
    ↓
记录压缩日志
```

### 4.3 记忆读取流程

```
Agent 请求读取记忆
    ↓
提供查询条件（关键词/时间/类型）
    ↓
搜索匹配的记忆片段
    ↓
返回相关记忆内容
    ↓
可选：返回记忆元数据（时间、相关性评分）
```

### 4.4 完整执行示例

```typescript
// 完整流程示例
async function agent_loop_complete(context: AgentLoopContext): Promise<void> {
    // 1. 轮次检查
    if (!should_record_memory(context)) {
        return;
    }

    // 2. 记忆Agent总结（带错误处理）
    const entry = await with_error_handling(
        () => summarize_to_memory(context),
        (error) => handle_agent_failure(context, error),
        '记忆Agent总结',
    );

    // 3. 写入（带错误处理）
    const write_result = await with_error_handling(
        () => write_memory(entry),
        (error) => handle_write_failure(entry, error),
        '记忆写入',
    );

    // 4. 压缩检查
    if (write_result.success && write_result.lines_after > config.max_lines) {
        await with_error_handling(
            () => compress_memory(config.compress_lines),
            (error) => handle_compress_failure(error),
            '记忆压缩',
        );
    }
}
```

---

## 5. 执行模式详解

### 5.1 同步模式

```typescript
async function sync_mode(context: AgentLoopContext): Promise<void> {
    // 1. 检查轮次
    if (!should_record_memory(context)) {
        return;
    }

    // 2. 记忆Agent总结（阻塞等待）
    const entry = await summarize_to_memory(context);

    // 3. 写入（阻塞等待）
    const write_result = await write_memory(entry);

    // 4. 检查行数并压缩（如果需要）
    if (write_result.lines_after > config.max_lines) {
        await compress_memory(config.compress_lines);
    }
}
```

**特点：**

-   ✅ 写入后立即检查并压缩
-   ✅ 适合小规模记忆
-   ✅ 简单可靠，易于调试
-   ❌ 阻塞 Agent Loop 直到完成

**适用场景：** 小任务、需要确认的场景

### 5.2 异步模式

```typescript
async function async_mode(context: AgentLoopContext): Promise<void> {
    // 1. 检查轮次
    if (!should_record_memory(context)) {
        return;
    }

    // 2. 非阻塞启动记忆流程
    summarize_to_memory(context)
        .then((entry) => write_memory(entry))
        .then((result) => {
            if (result.lines_after > config.max_lines) {
                // 后台压缩
                compress_memory(config.compress_lines).then((compress_result) => {
                    console.log('压缩完成', compress_result);
                });
            }
        })
        .catch((error) => {
            // 异步错误处理
            console.error('记忆流程失败', error);
        });

    // 3. 立即返回，不阻塞Agent
    return;
}
```

**特点：**

-   ✅ 写入后立即返回，后台执行
-   ✅ 适合大规模记忆
-   ✅ 不阻塞 Agent Loop
-   ❌ 需要错误处理和日志

**适用场景：** 大任务、快速返回的场景

### 5.3 批量模式

```typescript
class BatchMemoryManager {
    private queue: AgentLoopContext[] = [];
    private timer: NodeJS.Timeout | null = null;

    // 添加到队列
    add_to_batch(context: AgentLoopContext): void {
        if (should_record_memory(context)) {
            this.queue.push(context);

            // 启动定时器（如果未启动）
            if (!this.timer) {
                this.timer = setTimeout(() => this.process_batch(), 5000);
            }

            // 或者达到数量阈值
            if (this.queue.length >= 10) {
                this.process_batch();
            }
        }
    }

    // 处理批量
    private async process_batch(): Promise<void> {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.queue.length === 0) return;

        // 1. 批量总结
        const entries = await Promise.all(this.queue.map((ctx) => summarize_to_memory(ctx)));

        // 2. 批量写入
        const results = await Promise.all(entries.map((entry) => write_memory(entry)));

        // 3. 检查是否需要压缩
        const last_result = results[results.length - 1];
        if (last_result.lines_after > config.max_lines) {
            await compress_memory(config.compress_lines);
        }

        // 4. 清空队列
        this.queue = [];
    }
}
```

**特点：**

-   ✅ 累积多条记忆后统一处理
-   ✅ 适合高频 Agent 场景
-   ✅ 减少文件 I/O 次数
-   ❌ 需要队列管理

**适用场景：** 高频场景、批量任务

### 5.4 智能模式

```typescript
async function smart_mode(context: AgentLoopContext): Promise<void> {
    const config = get_memory_config();

    // 小轮次任务 → 同步模式
    if (context.round_count <= 20) {
        return sync_mode(context);
    }

    // 大轮次任务 → 异步模式
    if (context.round_count > 20 && context.round_count <= 100) {
        return async_mode(context);
    }

    // 超大轮次任务 → 批量模式
    if (context.round_count > 100) {
        batch_manager.add_to_batch(context);
        return;
    }
}
```

**特点：**

-   ✅ 自动根据任务复杂度选择模式
-   ✅ 平衡性能和可靠性
-   ✅ 最佳实践推荐

**适用场景：** 通用场景、不确定任务规模

---

## 7. 配置系统

### 7.1 默认配置

```typescript
const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
    // 文件配置
    file_path: '.langgraph_api/memory.md',
    max_lines: 500,

    // 轮次配置
    round_threshold: 10,

    // 压缩配置
    compress_lines: 100,
    auto_compress: true,
    compression_ratio: 0.6,

    // 记忆Agent配置
    agent_model: 'gpt-4',
    timeout: 30,
    retry_times: 3,
    fallback_enabled: true,

    // 性能配置
    cache_enabled: true,
    async_mode: false,
};
```

### 7.2 配置项说明

| 配置项              | 类型                          | 默认值                     | 说明                                     |
| ------------------- | ----------------------------- | -------------------------- | ---------------------------------------- |
| `file_path`         | `string`                      | `.langgraph_api/memory.md` | 记忆文件存储路径                         |
| `max_lines`         | `number`                      | `500`                      | 记忆文件最大行数，超过触发压缩           |
| `round_threshold`   | `number`                      | `10`                       | 轮次阈值，仅当 `round_count > 10` 时记忆 |
| `compress_lines`    | `number`                      | `100`                      | 压缩后保留的目标行数                     |
| `auto_compress`     | `boolean`                     | `true`                     | 写入后是否自动检查并压缩                 |
| `compression_ratio` | `number`                      | `0.6`                      | 压缩保留比例（0-1）                      |
| `agent_model`       | `string`                      | `gpt-4`                    | 记忆 Agent 使用的 AI 模型                |
| `timeout`           | `number`                      | `30`                       | AI 调用超时时间（秒）                    |
| `retry_times`       | `number`                      | `3`                        | AI 调用失败重试次数                      |
| `fallback_enabled`  | `boolean`                     | `true`                     | 是否启用降级策略                         |
| `privacy_level`     | `'low' \| 'medium' \| 'high'` | `'medium'`                 | 隐私保护级别                             |
| `cache_enabled`     | `boolean`                     | `true`                     | 是否启用结果缓存                         |
| `async_mode`        | `boolean`                     | `false`                    | 是否启用异步写入模式                     |

### 7.3 配置使用示例

```typescript
// 读取默认配置
const config = get_memory_config();

// 更新配置
const new_config = get_memory_config({
    max_lines: 1000,
    round_threshold: 15,
    auto_compress: false,
});

// 临时配置（单次操作）
const entry = await summarize_to_memory(context, {
    timeout: 60,
    agent_model: 'gpt-3.5-turbo',
});
```
