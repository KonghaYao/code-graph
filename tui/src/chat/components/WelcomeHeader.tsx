import React from 'react';
import { Box, Text } from 'ink';
import { getCurrentUser } from '../../utils/user';

const WelcomeHeader: React.FC = () => {
    const username = getCurrentUser();
    const date = new Date().toLocaleDateString();

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
            {/* Header: System Info */}
            <Box flexDirection="row" justifyContent="space-between" borderBottom={false}>
                 <Text color="cyan" bold>SYSTEM_OS_v2.0</Text>
                 <Text color="gray">{date}</Text>
            </Box>

            {/* Main Content */}
            <Box flexDirection="row" marginTop={1} gap={2}>
                 {/* Left: Logo */}
                 <Box flexDirection="column">
                     <Text color="magenta" bold>
{`   ______          __        ______                 __
  / ____/____  ___/ /__     / ____/________ _____  / /_
 / /    / __ \\/ __  / _ \\   / / __/ ___/ __ \`/ __ \\/ __ \\
/ /___ / /_/ / /_/ /  __/  / /_/ / /  / /_/ / /_/ / / / /
\\____/ \\____/\\__,_/\\___/   \\____/_/   \\__,_/ .___/_/ /_/
                                          /_/`}
                     </Text>
                 </Box>

                 {/* Right: Status Panel */}
                 <Box flexDirection="column" justifyContent="center" flexGrow={1}>
                     <Box marginBottom={1}>
                        <Text color="green" bold> [ SYSTEM ONLINE ]</Text>
                     </Box>
                     
                     <Box flexDirection="column" gap={0}>
                         <Box>
                             <Text color="blue" dimColor>USER  :: </Text>
                             <Text color="white">{username}</Text>
                         </Box>
                         <Box>
                             <Text color="blue" dimColor>ARCH  :: </Text>
                             <Text color="white">{process.arch}</Text>
                         </Box>
                         <Box>
                             <Text color="blue" dimColor>NODE  :: </Text>
                             <Text color="white">{process.version}</Text>
                         </Box>
                     </Box>
                 </Box>
            </Box>

            {/* Footer: Capabilities */}
            <Box marginTop={1} paddingTop={1} borderTop={false} flexDirection="row" justifyContent="space-between">
                <Box gap={3}>
                    <Box>
                        <Text color="green">●</Text>
                        <Text color="white" dimColor> AGENTS</Text>
                    </Box>
                    <Box>
                        <Text color="green">●</Text>
                        <Text color="white" dimColor> TOOLS</Text>
                    </Box>
                    <Box>
                        <Text color="green">●</Text>
                        <Text color="white" dimColor> FILESYSTEM</Text>
                    </Box>
                </Box>
                
                <Box>
                     <Text color="yellow" bold>{`>>> WAITING_FOR_INPUT`}</Text>
                     <Text color="yellow" dimColor> ▌</Text>
                </Box>
            </Box>
        </Box>
    );
};

export default WelcomeHeader;
