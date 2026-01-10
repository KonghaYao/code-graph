import React from 'react';
import { Box, Text } from 'ink';

export interface ProgressBarProps {
    value: number;
    max?: number;
    size?: number;
    label?: string;
    color?: 'green' | 'blue' | 'yellow' | 'red' | 'cyan' | 'magenta';
    showPercentage?: boolean;
    animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    size = 40,
    label,
    color = 'green',
    showPercentage = true,
    animated = false,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const filled = Math.round((size * percentage) / 100);
    const empty = size - filled;

    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);

    const bar = (
        <Text>
            <Text color={color}>{filledBar}</Text>
            <Text dim>{emptyBar}</Text>
        </Text>
    );

    const percentageText = showPercentage ? (
        <Text color={color}> {Math.round(percentage)}%</Text>
    ) : null;

    return (
        <Box flexDirection="column">
            {label && (
                <Box marginBottom={1}>
                    <Text bold>{label}</Text>
                </Box>
            )}
            <Box>
                {bar}
                {percentageText}
            </Box>
        </Box>
    );
};
