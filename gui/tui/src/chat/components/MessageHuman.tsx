import React from 'react';
import { Box, Text } from 'ink';

interface MessageHumanProps {
    content: string | any[];
}

const MessageHuman: React.FC<MessageHumanProps> = ({ content }) => {
    const renderContent = () => {
        if (typeof content === 'string') {
            return <Text color="white">{content}</Text>;
        }

        if (Array.isArray(content)) {
            return content
                .filter((item) => item.type === 'text')
                .map((item, index) => (
                    <Text key={index} color="white">
                        {item.text}
                    </Text>
                ));
        }
        // Fallback for unexpected content types
        return <Text color="white">{JSON.stringify(content)}</Text>;
    };

    return (
        <Box justifyContent="flex-end">
            <Box paddingX={1} borderStyle="round">
                {renderContent()}
            </Box>
        </Box>
    );
};

export default MessageHuman;
