import React from 'react';
import { Box, Text } from 'ink';

interface UsageMetadataProps {
    usage_metadata: Partial<{
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
        prompt_tokens_details?: any;
        completion_tokens_details?: any;
    }>;
    response_metadata?: {
        model_name?: string;
    };
    spend_time?: number;
    tool_call_id?: string;
    id?: string;
}

const formatTokens = (tokens: number | undefined) => {
    return (tokens || 0).toString();
};

export const UsageMetadata: React.FC<UsageMetadataProps> = ({
    usage_metadata,
    spend_time,
    response_metadata,
    id,
    tool_call_id,
}) => {
    if (!usage_metadata && !spend_time && !response_metadata && !id && !tool_call_id) {
        return null;
    }

    // Normalize numeric values to avoid NaN rendering
    const outputTokens = Number(usage_metadata?.output_tokens ?? 0);
    const inputTokens = Number(usage_metadata?.input_tokens ?? 0);
    const totalTokens = Number(usage_metadata?.total_tokens ?? 0);

    const spendSecondsRaw = Number(spend_time) / 1000;
    const spendSeconds = Number.isFinite(spendSecondsRaw) ? spendSecondsRaw : 0;

    const speed = spendSeconds > 0 && Number.isFinite(outputTokens) ? outputTokens / spendSeconds : 0;

    return (
        <Box marginTop={1}>
            <Box gap={2}>
                {(totalTokens > 0 || inputTokens > 0 || outputTokens > 0) && (
                    <Text color="gray">
                        📊 <Text>{formatTokens(totalTokens)}</Text> 📥 <Text>{formatTokens(inputTokens)}</Text> 📤{' '}
                        <Text>{formatTokens(outputTokens)}</Text>
                    </Text>
                )}
                {spendSeconds > 0 && (
                    <Text color="gray">
                        ⏱️ <Text>{spendSeconds.toFixed(2)}</Text>s
                    </Text>
                )}
                {speed > 0 && (
                    <Text color="gray">
                        ⚡ <Text>{speed.toFixed(2)}</Text> TPS
                    </Text>
                )}
                {response_metadata?.model_name && (
                    <Text color="gray">
                        🤖 <Text>{response_metadata.model_name}</Text>
                    </Text>
                )}
                {tool_call_id && (
                    <Text color="gray">
                        #️⃣ <Text>{tool_call_id}</Text>
                    </Text>
                )}
                {id && (
                    <Text color="gray">
                        🆔 <Text>{id}</Text>
                    </Text>
                )}
            </Box>
        </Box>
    );
};
