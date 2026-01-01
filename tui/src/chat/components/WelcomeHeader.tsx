import React from 'react';
import { Box, Text } from 'ink';
import { getCurrentUser } from '../../utils/user';

const WelcomeHeader: React.FC = () => {
    const username = getCurrentUser();

    return (
        <Box flexDirection="column" paddingX={1} marginBottom={1} borderStyle="round" borderColor="cyan">
            <Box flexDirection="column" alignItems="center">
                <Text color="magenta" bold>
{`
  ____          _        ____                 _     
 / ___|___   __| | ___  / ___|_ __ __ _ _ __ | |__  
| |   / _ \\ / _\` |/ _ \\| |  _| '__/ _\` | '_ \\| '_ \\ 
| |__| (_) | (_| |  __/| |_| | | | (_| | |_) | | | |
 \\____\\___/ \\__,_|\\___| \\____|_|  \\__,_| .__/|_| |_|
                                       |_|          
`}
                </Text>
            </Box>
            
            <Box flexDirection="column" alignItems="center" marginTop={0}>
                <Text color="green" bold>
                    🚀 Hello {username}, welcome to AI Powered Code Assistant
                </Text>
                
                <Box marginTop={1} gap={2}>
                    <Text>🤖 Chat Agents</Text>
                    <Text>⚡ Command Tools</Text>
                    <Text>📁 File Ops</Text>
                </Box>
            </Box>
        </Box>
    );
};

export default WelcomeHeader;

