import { createUITool, ToolManager } from '@langgraph-js/sdk';
import { Box, Text } from 'ink';
import { todoWriteSchema } from '../../../../agents/code/tools/task_tools/todo_tool';

interface TodoItem {
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
}

interface TodoWriteInput {
    todos: TodoItem[];
}

const STATUS_COLORS = {
    pending: 'gray',
    in_progress: 'yellow',
    completed: 'green',
};

const STATUS_SYMBOLS = {
    pending: '○',
    in_progress: '◐',
    completed: '✓',
};

export const todo_tool = createUITool({
    name: 'TodoWrite',
    description: 'Use this tool to create and manage a structured task list',
    parameters: todoWriteSchema.shape,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const input = tool.getInputRepaired() as TodoWriteInput;
        // Validate input
        if (!input || !input.todos || !Array.isArray(input.todos)) {
            return (
                <Box flexDirection="column" borderStyle="round" borderColor="red">
                    <Text color="red">Error: Invalid todo data structure</Text>
                </Box>
            );
        }

        const todos = input.todos;

        // Calculate statistics
        const total = todos.length;
        const completed = todos.filter((t) => t.status === 'completed').length;
        // Render todo list
        const renderTodoList = () => {
            if (todos.length === 0) {
                return (
                    <Box padding={1}>
                        <Text color="gray">No tasks in todo list</Text>
                    </Box>
                );
            }

            return (
                <Box flexDirection="column" marginTop={1}>
                    {todos.map((todo, index) => (
                        <Box paddingX={1} paddingY={0}>
                            <Text color={STATUS_COLORS[todo.status]} bold>
                                {STATUS_SYMBOLS[todo.status]}{' '}
                            </Text>
                            <Text>
                                {index + 1}. {todo.content}
                            </Text>
                            {todo.status !== 'pending' && (
                                <Text color="gray" dimColor>
                                    {' '}
                                    [{todo.status}]
                                </Text>
                            )}
                        </Box>
                    ))}
                </Box>
            );
        };

        // Main render
        return (
            <Box flexDirection="column">
                {/* Todo List */}
                <Box flexDirection="column" marginTop={1}>
                    <Text color="magenta" bold>
                        📋 Tasks({completed}/{total}):
                    </Text>
                    {renderTodoList()}
                </Box>
            </Box>
        );
    },
});
