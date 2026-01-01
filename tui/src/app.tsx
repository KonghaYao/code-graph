import { render } from 'ink';
import { Chat } from './index';

// @ts-ignore - ink types might be outdated or missing altScreen property in some versions, but it is supported
render(<Chat />, {
    altScreen: false,
});
