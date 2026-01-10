import React from 'react';
import { parse } from 'marked';
import { Text } from 'ink';
import MarkedTerminal from 'marked-terminal';

type MarkdownProps = {
    children: string;
    [key: string]: any;
};

const Markdown: React.FC<MarkdownProps> = ({ children, ...options }) => {
    // Avoid global configuration by passing options directly to parse.
    const renderer = new MarkedTerminal({}, {});
    const parsedText = parse(children || '', { renderer: renderer as any }) as string;

    // Trim trailing newline from marked to prevent layout issues.
    return <Text>{parsedText.trim()}</Text>;
};

export default Markdown;
