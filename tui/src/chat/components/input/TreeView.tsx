import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useFocus } from 'ink';

export interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
    isExpanded?: boolean;
    disabled?: boolean;
}

export interface TreeViewProps {
    data: TreeNode[];
    onSelect?: (node: TreeNode) => void;
    onToggle?: (node: TreeNode) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    expandable?: boolean;
    showIcons?: boolean;
}

export const TreeView: React.FC<TreeViewProps> = ({
    data,
    onSelect,
    onToggle,
    disabled = false,
    autoFocus = true,
    expandable = true,
    showIcons = true,
}) => {
    const { isFocused } = useFocus({ autoFocus });
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Flatten tree for linear navigation
    const flatTree = useMemo(() => {
        const result: Array<{ node: TreeNode; level: number; index: number }> = [];

        const flatten = (nodes: TreeNode[], level: number, parentIndex?: number) => {
            let currentIndex = parentIndex !== undefined ? parentIndex + 1 : 0;

            for (const node of nodes) {
                result.push({ node, level, index: currentIndex });
                currentIndex++;

                if (node.children && expandedNodes.has(node.id)) {
                    currentIndex = flatten(node.children, level + 1, currentIndex);
                }
            }

            return currentIndex;
        };

        flatten(data, 0);
        return result;
    }, [data, expandedNodes]);

    const toggleExpand = useCallback(
        (nodeId: string) => {
            if (!expandable) return;

            setExpandedNodes((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(nodeId)) {
                    newSet.delete(nodeId);
                } else {
                    newSet.add(nodeId);
                }
                return newSet;
            });
        },
        [expandable],
    );

    const getCurrentNode = useCallback(() => {
        return flatTree[selectedIndex]?.node;
    }, [flatTree, selectedIndex]);

    useInput(
        (input, key) => {
            if (disabled) return;

            const currentNode = getCurrentNode();
            if (currentNode?.disabled) return;

            if (key.upArrow) {
                setSelectedIndex((prev) => Math.max(0, prev - 1));
            } else if (key.downArrow) {
                setSelectedIndex((prev) => Math.min(flatTree.length - 1, prev + 1));
            } else if (key.return || input === ' ') {
                const node = getCurrentNode();
                if (node) {
                    onSelect?.(node);

                    if (expandable && node.children && node.children.length > 0) {
                        toggleExpand(node.id);
                        onToggle?.(node);
                    }
                }
            } else if (key.leftArrow) {
                const node = getCurrentNode();
                if (node && expandable && expandedNodes.has(node.id)) {
                    toggleExpand(node.id);
                    onToggle?.(node);
                }
            } else if (key.rightArrow) {
                const node = getCurrentNode();
                if (node && expandable && node.children && node.children.length > 0 && !expandedNodes.has(node.id)) {
                    toggleExpand(node.id);
                    onToggle?.(node);
                }
            }
        },
        { isActive: isFocused && !disabled },
    );

    const renderNode = (node: TreeNode, level: number, isHighlighted: boolean) => {
        const indent = '  '.repeat(level);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const icon = showIcons ? (hasChildren ? (isExpanded ? '📂' : '📁') : '📄') : '';
        const expandIcon = hasChildren ? (isExpanded ? '▼' : '▶') : '  ';

        const color = node.disabled ? 'gray' : isHighlighted ? 'green' : 'white';

        return (
            <Box key={node.id}>
                <Text color={color} bold={isHighlighted && !node.disabled}>
                    {isHighlighted ? '> ' : '  '}
                    {indent}
                    {expandable && expandIcon}{' '}
                    {icon}{' '}
                    {node.label}
                </Text>
            </Box>
        );
    };

    return (
        <Box flexDirection="column" flexGrow={1}>
            <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
                {flatTree.map(({ node, level }, index) => renderNode(node, level, index === selectedIndex))}
            </Box>

            {isFocused && !disabled && (
                <Box marginTop={1}>
                    <Text dim color="gray">
                        ↑↓ Navigate | Enter Select | ←→ Expand/Collapse
                    </Text>
                </Box>
            )}
        </Box>
    );
};
