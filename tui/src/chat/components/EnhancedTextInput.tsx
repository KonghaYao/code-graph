import { useState, useEffect } from 'react';
import { Text, useInput } from 'ink';
import chalk from 'chalk';
import { Key } from 'readline';

export type Props = {
    /**
     * Text to display when `value` is empty.
     */
    readonly placeholder?: string;

    /**
     * Listen to user's input. Useful in case there are multiple input components
     * at the same time and input must be "routed" to a specific component.
     */
    readonly focus?: boolean; // eslint-disable-line react/boolean-prop-naming

    /**
     * Replace all chars and mask the value. Useful for password inputs.
     */
    readonly mask?: string;

    /**
     * Whether to show cursor and allow navigation inside text input with arrow keys.
     */
    readonly showCursor?: boolean; // eslint-disable-line react/boolean-prop-naming

    /**
     * Highlight pasted text
     */
    readonly highlightPastedText?: boolean; // eslint-disable-line react/boolean-prop-naming

    /**
     * Value to display in a text input.
     */
    readonly value: string;

    /**
     * Function to call when value updates.
     */
    readonly onChange: (value: string) => void;

    readonly onHotKey: (value: string, key: Key) => boolean;

    /**
     * Function to call when `Enter` is pressed, where first argument is a value of the input.
     */
    readonly onSubmit?: (value: string) => void;

    /**
     * Whether the input is disabled and cannot be edited.
     */
    readonly disabled?: boolean; // eslint-disable-line react/boolean-prop-naming
};

function TextInput({
    value: originalValue,
    placeholder = '',
    focus = true,
    mask,
    highlightPastedText = false,
    showCursor = true,
    onChange,
    onSubmit,
    onHotKey,
    disabled = false,
}: Props) {
    const [state, setState] = useState({
        cursorOffset: (originalValue || '').length,
        cursorWidth: 0,
    });

    const { cursorOffset, cursorWidth } = state;

    useEffect(() => {
        setState((previousState) => {
            if (!focus || !showCursor) {
                return previousState;
            }

            const newValue = originalValue || '';

            if (previousState.cursorOffset > newValue.length - 1) {
                return {
                    cursorOffset: newValue.length,
                    cursorWidth: 0,
                };
            }

            return previousState;
        });
    }, [originalValue, focus, showCursor]);

    const cursorActualWidth = highlightPastedText ? cursorWidth : 0;

    const value = mask ? mask.repeat(originalValue.length) : originalValue;
    let renderedValue = value;
    let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

    // Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
    if (showCursor && focus && !disabled) {
        renderedPlaceholder =
            placeholder.length > 0
                ? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
                : chalk.inverse(' ');

        renderedValue = value.length > 0 ? '' : chalk.inverse(' ');

        let i = 0;

        for (const char of value) {
            renderedValue += i >= cursorOffset - cursorActualWidth && i <= cursorOffset ? chalk.inverse(char) : char;

            i++;
        }

        if (value.length > 0 && cursorOffset === value.length) {
            renderedValue += chalk.inverse(' ');
        }
    }

    useInput(
        (input, key) => {
            if (disabled) {
                return;
            }

            if (onHotKey) {
                const result = onHotKey(input, key);
                if (!result) {
                    return;
                }
            }
            // Allow upArrow/downArrow only with meta/ctrl (for jump to line start/end)
            // Otherwise return early for regular up/down navigation
            if (
                (key.upArrow && !key.meta && !key.ctrl) ||
                (key.downArrow && !key.meta && !key.ctrl) ||
                (key.ctrl && input === 'c') ||
                key.tab ||
                (key.shift && key.tab)
            ) {
                return;
            }

            if (key.return) {
                if (onSubmit) {
                    onSubmit(originalValue);
                }

                return;
            }

            let nextCursorOffset = cursorOffset;
            let nextValue = originalValue;
            let nextCursorWidth = 0;

            // Alt + Left/Right: Jump by words
            if (key.leftArrow) {
                if (showCursor) {
                    nextCursorOffset--;
                }
            } else if (key.rightArrow) {
                if (showCursor) {
                    nextCursorOffset++;
                }
            } else if (key.upArrow && (key.meta || key.ctrl)) {
                // Cmd/Ctrl + Up: Jump to line start
                if (showCursor) {
                    nextCursorOffset = 0;
                }
            } else if (key.downArrow && (key.meta || key.ctrl)) {
                // Cmd/Ctrl + Down: Jump to line end
                if (showCursor) {
                    nextCursorOffset = originalValue.length;
                }
            } else if (key.backspace || key.delete) {
                if (cursorOffset > 0) {
                    nextValue =
                        originalValue.slice(0, cursorOffset - 1) +
                        originalValue.slice(cursorOffset, originalValue.length);

                    nextCursorOffset--;
                }
            } else {
                nextValue =
                    originalValue.slice(0, cursorOffset) +
                    input +
                    originalValue.slice(cursorOffset, originalValue.length);

                nextCursorOffset += input.length;

                if (input.length > 1) {
                    nextCursorWidth = input.length;
                }
            }

            if (cursorOffset < 0) {
                nextCursorOffset = 0;
            }

            if (cursorOffset > originalValue.length) {
                nextCursorOffset = originalValue.length;
            }

            setState({
                cursorOffset: nextCursorOffset,
                cursorWidth: nextCursorWidth,
            });

            if (nextValue !== originalValue) {
                onChange(nextValue);
            }
        },
        { isActive: focus && !disabled },
    );

    // Apply dim styling when disabled
    const displayText = disabled ? chalk.dim(renderedValue) : renderedValue;
    const displayPlaceholder = disabled ? chalk.dim(renderedPlaceholder) : renderedPlaceholder;

    return <Text>{placeholder ? (value.length > 0 ? displayText : displayPlaceholder) : displayText}</Text>;
}
export { TextInput as EnhancedTextInput };
export default TextInput;

type UncontrolledProps = {
    /**
     * Initial value.
     */
    readonly initialValue?: string;
} & Omit<Props, 'value' | 'onChange'>;

export function UncontrolledTextInput({ initialValue = '', disabled = false, ...props }: UncontrolledProps) {
    const [value, setValue] = useState(initialValue);

    return <TextInput {...props} value={value} onChange={setValue} disabled={disabled} />;
}
