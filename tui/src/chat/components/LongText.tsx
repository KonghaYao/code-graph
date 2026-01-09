import React from 'react';
import { Box, Text } from 'ink';

interface LongTextProps {
    text: string;
    prefix?: string;
    indent?: string;
}

const LongText: React.FC<LongTextProps> = ({ text, prefix = '', indent = '   ' }) => {
    // Split message content into lines to prevent CLI flickering with long text
    const lines = text.split('\n');

    return (
        <Box flexDirection="column">
            {lines.map((line, index) => (
                <Text key={index}>
                    {index === 0 && <Text color="gray">{prefix}</Text>}
                    {index > 0 && <Text color="gray">{indent}</Text>}
                    <Text>{line}</Text>
                </Text>
            ))}
        </Box>
    );
};

export default LongText;
