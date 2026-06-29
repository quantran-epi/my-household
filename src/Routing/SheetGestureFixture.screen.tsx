import React from "react";
import { Sheet } from "@components/Sheet";

// Test-only fixture screen (mounted at the StaticRoutes.SheetGestureFixture route,
// NOT linked from any user-facing nav). It mounts the upgraded 07-02 Sheet in the
// variants the 07-03 WebKit/iPhone touch e2e needs but which the product screens do
// not expose deterministically: a plain sheet (drag-dismiss / spring-back /
// safe-area), a tall scrolling sheet (scroll-vs-drag arbitration, SHEET-03), a
// maskClosable={false} sheet (SHEET-04 protection), and a nested A->B stack
// (SHEET-06). Threat T-07-02: serves no real data, no PII, no auth boundary.
const triggerStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    minHeight: 48,
    margin: "8px 0",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #d9d9d9",
    background: "#fff",
    fontSize: 16,
    cursor: "pointer",
};

const listItemStyle: React.CSSProperties = {
    padding: "14px 12px",
    borderBottom: "1px solid #eee",
    fontSize: 15,
};

export const SheetGestureFixtureScreen: React.FunctionComponent = () => {
    const [basicOpen, setBasicOpen] = React.useState(false);
    const [scrollOpen, setScrollOpen] = React.useState(false);
    const [protectedOpen, setProtectedOpen] = React.useState(false);
    const [nestedAOpen, setNestedAOpen] = React.useState(false);
    const [nestedBOpen, setNestedBOpen] = React.useState(false);

    const longList = Array.from({ length: 40 }, (_, i) => i);

    return (
        <div style={{ padding: 16 }} data-testid="sheet-gesture-fixture">
            <h1 style={{ fontSize: 18 }}>Sheet gesture fixture</h1>

            <button type="button" data-testid="open-basic-sheet" style={triggerStyle} onClick={() => setBasicOpen(true)}>
                Open basic sheet
            </button>
            <button type="button" data-testid="open-scroll-sheet" style={triggerStyle} onClick={() => setScrollOpen(true)}>
                Open scrolling sheet
            </button>
            <button type="button" data-testid="open-protected-sheet" style={triggerStyle} onClick={() => setProtectedOpen(true)}>
                Open protected sheet
            </button>
            <button type="button" data-testid="open-nested-a" style={triggerStyle} onClick={() => setNestedAOpen(true)}>
                Open nested sheet A
            </button>

            <Sheet
                open={basicOpen}
                onClose={() => setBasicOpen(false)}
                title="Basic sheet"
                data-testid="sheet-basic"
            >
                <p data-testid="sheet-basic-body">Drag the grabber down to dismiss, or a short pull springs back.</p>
            </Sheet>

            <Sheet
                open={scrollOpen}
                onClose={() => setScrollOpen(false)}
                title="Scrolling sheet"
                height="60vh"
                data-testid="sheet-scroll"
            >
                <div data-testid="sheet-scroll-list">
                    {longList.map((i) => (
                        <div key={i} style={listItemStyle}>Row {i + 1}</div>
                    ))}
                </div>
            </Sheet>

            <Sheet
                open={protectedOpen}
                onClose={() => setProtectedOpen(false)}
                title="Protected sheet"
                maskClosable={false}
                data-testid="sheet-protected"
            >
                <p>This sheet never drag-dismisses (maskClosable=false).</p>
            </Sheet>

            <Sheet
                open={nestedAOpen}
                onClose={() => setNestedAOpen(false)}
                title="Nested sheet A"
                data-testid="sheet-nested-a"
            >
                <p>Sheet A content.</p>
                <button type="button" data-testid="open-nested-b" style={triggerStyle} onClick={() => setNestedBOpen(true)}>
                    Open nested sheet B
                </button>
                <Sheet
                    open={nestedBOpen}
                    onClose={() => setNestedBOpen(false)}
                    title="Nested sheet B"
                    data-testid="sheet-nested-b"
                >
                    <p>Sheet B content stacked above A.</p>
                </Sheet>
            </Sheet>
        </div>
    );
};
