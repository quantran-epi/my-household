import { Layout as AntLayout } from 'antd';
import { iosTokens } from '@theme';
import { Box } from '../Box';

const { Content: AntContent } = AntLayout;

// Sticky chrome the scrollable content box sits between: fixed header + safe-area-raised
// bottom nav. Read from tokens so the height math and the nav stay single-sourced (D-05/D-07).
const chrome = iosTokens.layout.headerHeight + iosTokens.layout.bottomNavContainerMinHeight;

// vh→dvh cascade via a scoped <style> block (FastOverlay precedent): a single inline style
// object cannot carry two `height` keys (JS overwrites), so the 100vh fallback is declared
// first and the 100dvh winner second. With viewport-fit=cover, 100dvh spans the whole display
// including behind the notch/home-indicator, so BOTH insets are subtracted exactly once
// (Pitfall 1 — no double-count, no extra padding on this box). Pitfall 2: one unit family per
// declaration — never 100vh and 100dvh in the same rule.
const contentHeightCss = `#app-content {
    height: calc(100vh - ${chrome}px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    height: calc(100dvh - ${chrome}px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}`;

export const Content = ({
    children,
    ...props
}) => {
    return <AntContent {...props}>
        <style>{contentHeightCss}</style>
        <Box
            id="app-content"
            data-testid="app-content"
            style={{
                padding: iosTokens.spacing.md,
                background: iosTokens.surface.contentGradient,
                overflowY: "auto",
                overflowX: "hidden",
                boxSizing: "border-box",
            }}
        >
            {children}
        </Box>
    </AntContent>
}
