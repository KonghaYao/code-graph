import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useFocus } from 'ink';
import { UncontrolledTextInput } from './EnhancedTextInput';

export interface SearchBarProps {
    items: string[];
    onSelect?: (item: string) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    caseSensitive?: boolean;
    fuzzy?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    items,
    onSelect,
    placeholder = 'Search...',
    disabled = false,
    autoFocus = true,
    caseSensitive = false,
    fuzzy = false,
}) => {
    const { isFocused } = useFocus({ autoFocus });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Filter items based on search query
    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;

        const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();

        return items.filter((item) => {
            const text = caseSensitive ? item : item.toLowerCase();

            if (fuzzy) {
                // Fuzzy match: characters can be anywhere
                const chars = query.split('');
                let searchIndex = 0;
                for (const char of text) {
                    if (char === chars[searchIndex]) {
                        searchIndex++;
                        if (searchIndex === chars.length) return true;
                    }
                }
                return false;
            } else {
                // Standard match: query must be substring
                return text.includes(query);
            }
        });
    }, [items, searchQuery, caseSensitive, fuzzy]);

    // Reset selected index when filtered items change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    const handleSelect = useCallback(() => {
        if (filteredItems.length > 0 && onSelect) {
            onSelect(filteredItems[selectedIndex]);
        }
    }, [filteredItems, selectedIndex, onSelect]);

    useInput(
        (input, key) => {
            if (disabled) return;

            if (key.upArrow) {
                setSelectedIndex((prev) => Math.max(0, prev - 1));
            } else if (key.downArrow) {
                setSelectedIndex((prev) => Math.min(filteredItems.length - 1, prev + 1));
            } else if (key.return) {
                handleSelect();
            } else if (key.escape) {
                setSearchQuery('');
            }
        },
        { isActive: isFocused && !disabled },
    );

    const maxVisibleItems = 10;
    const startIndex = Math.max(0, selectedIndex - Math.floor(maxVisibleItems / 2));
    const visibleItems = filteredItems.slice(startIndex, startIndex + maxVisibleItems);

    const highlightMatch = (text: string) => {
        if (!searchQuery) return text;

        const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
        const searchIn = caseSensitive ? text : text.toLowerCase();

        if (fuzzy) {
            // For fuzzy, just show the text
            return text;
        }

        const index = searchIn.indexOf(query);
        if (index === -1) return text;

        const before = text.slice(0, index);
        const match = text.slice(index, index + searchQuery.length);
        const after = text.slice(index + searchQuery.length);

        return (
            <>
                {before}
                <Text backgroundColor="yellow" color="black">
                    {match}
                </Text>
                {after}
            </>
        );
    };

    return (
        <Box flexDirection="column" flexGrow={1}>
            <Box marginBottom={1}>
                <Text color={isFocused && !disabled ? 'cyan' : 'gray'}>🔍</Text>
                <Box marginLeft={1} flexGrow={1}>
                    <UncontrolledTextInput
                        placeholder={placeholder}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        autoFocus={autoFocus}
                        disabled={disabled}
                    />
                </Box>
            </Box>

            {searchQuery && (
                <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
                    {visibleItems.length === 0 ? (
                        <Box>
                            <Text color="gray" dim>
                                No results found
                            </Text>
                        </Box>
                    ) : (
                        visibleItems.map((item, index) => {
                            const actualIndex = startIndex + index;
                            const isSelected = actualIndex === selectedIndex;

                            return (
                                <Box key={item}>
                                    <Text color={isSelected ? 'green' : 'gray'} bold={isSelected}>
                                        {isSelected ? '> ' : '  '}
                                        {highlightMatch(item)}
                                    </Text>
                                </Box>
                            );
                        })
                    )}
                </Box>
            )}

            {isFocused && !disabled && searchQuery && filteredItems.length > 0 && (
                <Box marginTop={1}>
                    <Text dim color="gray">
                        {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} • ↑↓ Navigate • Enter Select
                    </Text>
                </Box>
            )}
        </Box>
    );
};
