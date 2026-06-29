import { CloseOutlined } from "@ant-design/icons";
import React from "react";
import { createPortal } from "react-dom";
import { shouldStartDrag, dragDecision, DragOrigin, DragDirection } from './dragDecision';

type FastOverlaySize = number | string;

export type FastOverlayBaseProps = {
    open: boolean;
    title: React.ReactNode;
    onClose: () => void;
    children?: React.ReactNode;
    zIndex?: number;
    maskClosable?: boolean;
    closable?: boolean;
    keyboard?: boolean;
    "data-testid"?: string;
};

export type SheetProps = FastOverlayBaseProps & {
    height?: FastOverlaySize;
};

type FastModalShellProps = FastOverlayBaseProps & {
    footer?: React.ReactNode;
    headerActions?: React.ReactNode;
    width?: FastOverlaySize;
    style?: React.CSSProperties;
    bodyStyle?: React.CSSProperties;
    afterOpenChange?: (open: boolean) => void;
};

type FastDrawerShellProps = FastOverlayBaseProps & {
    width?: FastOverlaySize;
};

const toCssSize = (value: FastOverlaySize | undefined, fallback: string): string => {
    if (typeof value === "number") return `${value}px`;
    return value ?? fallback;
};

const getOffset = (value: React.CSSProperties["top"], fallback: number): string => {
    if (typeof value === "number") return `${value}px`;
    if (typeof value === "string") return value;
    return `${fallback}px`;
};

const overlayMotionEase = "cubic-bezier(0.16, 1, 0.3, 1)";
const backdropInAnimation = `my-recipes-fast-overlay-fade-in 120ms ${overlayMotionEase} both`;
const modalInAnimation = `my-recipes-fast-modal-in 150ms ${overlayMotionEase} both`;
const drawerInAnimation = `my-recipes-fast-drawer-in 150ms ${overlayMotionEase} both`;
const sheetInAnimation = `my-recipes-fast-sheet-in 180ms ${overlayMotionEase} both`;
let nextOverlayStackToken = 1;
let activeOverlayStackTokens: number[] = [];

const allocateOverlayStackToken = (): number => {
    const token = nextOverlayStackToken;
    nextOverlayStackToken += 1;
    activeOverlayStackTokens = [...activeOverlayStackTokens, token];
    return token;
};

const releaseOverlayStackToken = (token: number) => {
    activeOverlayStackTokens = activeOverlayStackTokens.filter(item => item !== token);
};

const useBodyScrollLock = (locked: boolean) => {
    React.useEffect(() => {
        if (!locked) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [locked]);
};

const useEscapeClose = (open: boolean, onClose: () => void) => {
    React.useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, open]);
};

const useResolvedOverlayZIndex = (open: boolean, explicitZIndex: number | undefined, baseZIndex: number) => {
    const stackToken = React.useRef<number>();

    if (open && explicitZIndex === undefined && stackToken.current === undefined) {
        stackToken.current = allocateOverlayStackToken();
    }

    React.useEffect(() => {
        if (!open || explicitZIndex !== undefined || stackToken.current === undefined) return;
        const token = stackToken.current;

        return () => {
            releaseOverlayStackToken(token);
            if (stackToken.current === token) stackToken.current = undefined;
        };
    }, [explicitZIndex, open]);

    if (explicitZIndex !== undefined) return explicitZIndex;

    const token = stackToken.current;
    const stackIndex = token === undefined ? -1 : activeOverlayStackTokens.indexOf(token);
    return baseZIndex + Math.max(0, stackIndex) * 20;
};

const overlayMotionStyles = <style>{`
@keyframes my-recipes-fast-overlay-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes my-recipes-fast-modal-in { from { opacity: 0; transform: translate3d(0, 8px, 0) scale(0.986); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
@keyframes my-recipes-fast-drawer-in { from { opacity: 0.96; transform: translate3d(-14px, 0, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes my-recipes-fast-sheet-in { from { opacity: 0; transform: translate3d(0, 24px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@media (prefers-reduced-motion: reduce) {
  .my-recipes-fast-overlay,
  .my-recipes-fast-overlay * { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
`}</style>;

// Sheet-specific CSS that cannot live in the React `style` prop:
// - the vh -> dvh max-height cascade needs two same-key declarations
//   (the dvh rule wins on supporting UAs; the vh rule is the fallback);
// - `env(safe-area-inset-bottom)`, `overscroll-behavior`, and `touch-action`
//   read more clearly as real CSS and keep the spring-back transition under
//   the `.my-recipes-fast-overlay` reduced-motion clamp.
const sheetStyles = <style>{`
.my-recipes-fast-overlay__sheet {
  max-height: min(85vh, 720px);
  max-height: min(85dvh, 720px);
}
.my-recipes-fast-overlay__handle {
  touch-action: none;
}
.my-recipes-fast-overlay__body {
  overscroll-behavior: contain;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
`}</style>;

const closeButtonStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(116, 54, 220, 0.16)",
    borderRadius: 10,
    background: "#fff",
    color: "#5e2bbf",
    cursor: "pointer",
    flexShrink: 0,
};

const shellTitleStyle: React.CSSProperties = {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 650,
    color: "#2f2545",
};

const grabberStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "10px 0 4px",
    border: "none",
    background: "transparent",
    cursor: "grab",
    touchAction: "none",
    flexShrink: 0,
};

const grabberPillStyle: React.CSSProperties = {
    display: "block",
    width: 40,
    height: 5,
    borderRadius: 999,
    background: "rgba(74, 48, 130, 0.28)",
};

export const FastModalShell: React.FunctionComponent<FastModalShellProps> = ({
    open,
    title,
    onClose,
    children,
    footer,
    headerActions,
    width,
    zIndex,
    style,
    bodyStyle,
    maskClosable = true,
    closable = true,
    keyboard = true,
    afterOpenChange,
    "data-testid": testId,
}) => {
    useBodyScrollLock(open);
    useEscapeClose(open && keyboard, onClose);
    const resolvedZIndex = useResolvedOverlayZIndex(open, zIndex, 1200);

    React.useEffect(() => {
        if (!open || !afterOpenChange) return;
        const frame = window.requestAnimationFrame(() => afterOpenChange(true));
        return () => window.cancelAnimationFrame(frame);
    }, [afterOpenChange, open]);

    if (!open) return null;

    const top = getOffset(style?.top, 52);
    const panelWidth = toCssSize(width, "min(680px, calc(100vw - 28px))");

    return createPortal(
        <div
            className="my-recipes-fast-overlay"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: resolvedZIndex,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: `${top} 14px 18px`,
                background: "rgba(16, 24, 40, 0.36)",
                animation: backdropInAnimation,
                willChange: "opacity",
            }}
            onMouseDown={(event) => {
                if (maskClosable && event.target === event.currentTarget) onClose();
            }}
        >
            {overlayMotionStyles}
            <section
                role="dialog"
                aria-modal="true"
                data-testid={testId}
                style={{
                    width: panelWidth,
                    maxWidth: "100%",
                    maxHeight: `calc(100vh - ${top} - 18px)`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid rgba(232, 237, 245, 0.96)",
                    borderRadius: 14,
                    background: "#fff",
                    boxShadow: "0 18px 54px rgba(15, 23, 42, 0.24)",
                    animation: modalInAnimation,
                    transformOrigin: "top center",
                    willChange: "opacity, transform",
                    ...style,
                    top: undefined,
                }}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px 12px", borderBottom: "1px solid #f0f2f5" }}>
                    <div style={{ ...shellTitleStyle, flex: "1 1 auto" }}>{title}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {headerActions}
                        {closable && <button type="button" aria-label="Thoát" onClick={onClose} style={closeButtonStyle}>
                            <CloseOutlined />
                        </button>}
                    </div>
                </div>
                <div style={{ minHeight: 0, overflowY: "auto", padding: 16, ...bodyStyle }}>
                    {children}
                </div>
                {footer && <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 16px 14px", borderTop: "1px solid #f0f2f5", background: "#fbfcfe" }}>
                    {footer}
                </div>}
            </section>
        </div>,
        document.body,
    );
};

export const FastDrawerShell: React.FunctionComponent<FastDrawerShellProps> = ({
    open,
    title,
    onClose,
    children,
    width,
    zIndex,
    maskClosable = true,
    closable = true,
    keyboard = true,
    "data-testid": testId,
}) => {
    useBodyScrollLock(open);
    useEscapeClose(open && keyboard, onClose);
    const resolvedZIndex = useResolvedOverlayZIndex(open, zIndex, 1150);

    if (!open) return null;

    return createPortal(
        <div
            className="my-recipes-fast-overlay"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: resolvedZIndex,
                background: "rgba(16, 24, 40, 0.30)",
                animation: backdropInAnimation,
                willChange: "opacity",
            }}
            onMouseDown={(event) => {
                if (maskClosable && event.target === event.currentTarget) onClose();
            }}
        >
            {overlayMotionStyles}
            <aside
                role="dialog"
                aria-modal="true"
                data-testid={testId}
                style={{
                    width: toCssSize(width, "min(360px, calc(100vw - 38px))"),
                    maxWidth: "calc(100vw - 38px)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRight: "1px solid rgba(232, 237, 245, 0.96)",
    borderRadius: "0 18px 18px 0",
    background: "linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)",
    boxShadow: "16px 0 48px rgba(74, 48, 130, 0.24)",
                    animation: drawerInAnimation,
                    transformOrigin: "left center",
                    willChange: "opacity, transform",
                }}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 14px 12px 16px", borderBottom: "1px solid rgba(116, 54, 220, 0.10)", background: "rgba(255,255,255,0.72)" }}>
                    <div style={shellTitleStyle}>{title}</div>
                    {closable && <button type="button" aria-label="Ẩn menu" onClick={onClose} style={closeButtonStyle}>
                        <CloseOutlined />
                    </button>}
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {children}
                </div>
            </aside>
        </div>,
        document.body,
    );
};

export const Sheet: React.FunctionComponent<SheetProps> = ({
    open,
    title,
    onClose,
    children,
    height,
    zIndex,
    maskClosable = true,
    closable = true,
    keyboard = true,
    "data-testid": testId,
}) => {
    useBodyScrollLock(open);
    useEscapeClose(open && keyboard, onClose);
    const resolvedZIndex = useResolvedOverlayZIndex(open, zIndex, 1200);

    // Local (non-Redux) drag state. `offset` drives the live finger-follow
    // transform; `dragging` toggles transition:none so the sheet tracks the
    // finger 1:1, then re-enables the spring-back/dismiss transition on release.
    const [offset, setOffset] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);
    const sectionRef = React.useRef<HTMLElement | null>(null);
    const bodyRef = React.useRef<HTMLDivElement | null>(null);
    const triggerRef = React.useRef<Element | null>(null);
    // Mutable gesture bookkeeping kept in a ref so handlers stay referentially
    // stable and never trigger re-renders mid-drag.
    const gesture = React.useRef({
        active: false,
        startY: 0,
        lastY: 0,
        lastTime: 0,
        origin: "grabber" as DragOrigin,
    });

    // Focus trap: capture the trigger on open, move focus into the sheet, and
    // restore focus to the trigger on close/unmount (SHEET-01).
    React.useEffect(() => {
        if (!open) return;
        triggerRef.current = document.activeElement;
        const section = sectionRef.current;
        if (section) {
            const focusable = section.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            (focusable ?? section).focus();
        }
        return () => {
            const trigger = triggerRef.current as HTMLElement | null;
            if (trigger && typeof trigger.focus === "function") trigger.focus();
        };
    }, [open]);

    const onTrapKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== "Tab") return;
        const section = sectionRef.current;
        if (!section) return;
        const focusables = Array.from(
            section.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusables.length === 0) {
            event.preventDefault();
            section.focus();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement;
        if (event.shiftKey && activeEl === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && activeEl === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const beginDrag = (origin: DragOrigin) => (event: React.PointerEvent) => {
        // Stop the pointerdown from bubbling through the React tree to an
        // ancestor Sheet's drag handlers. A nested Sheet B renders as a React
        // child of Sheet A's body, so without this an interaction on B would
        // also start A's body drag and dismiss both sheets together (SHEET-06).
        event.stopPropagation();
        // For the body handle, only start a drag when the scroll body is at the
        // very top and the user is pulling down (shouldStartDrag B3); otherwise
        // let native scroll win. Grabber/header are always handles (B1/B2).
        const scrollTop = bodyRef.current ? bodyRef.current.scrollTop : 0;
        if (origin === "body" && scrollTop > 0) return;
        gesture.current = {
            active: true,
            startY: event.clientY,
            lastY: event.clientY,
            lastTime: event.timeStamp,
            origin,
        };
        // Pointer capture is intentionally NOT taken here. Capturing on
        // pointerdown retargets the subsequent pointerup (and its compatibility
        // click) to the handle element, which swallows taps on interactive
        // children rendered inside the sheet body/header (e.g. a button that
        // opens a nested sheet, or the close control). Capture is deferred to
        // onDragMove, taken only once a real drag is confirmed, so a plain tap
        // still dispatches its click to the actual target.
    };

    const onDragMove = (event: React.PointerEvent) => {
        const g = gesture.current;
        if (!g.active) return;
        const delta = event.clientY - g.startY;
        // First real move sample decides whether the gesture is allowed. For
        // the body handle, an upward move at the top is not a dismiss (B4) — let
        // native scroll take over and abandon the drag.
        if (!dragging) {
            const direction: DragDirection = delta < 0 ? "up" : "down";
            const scrollTop = bodyRef.current ? bodyRef.current.scrollTop : 0;
            if (!shouldStartDrag(g.origin, scrollTop, direction)) {
                g.active = false;
                return;
            }
            // A real drag is now confirmed (not a tap). Capture the pointer so
            // the finger continues to drive the sheet even if it slides off the
            // handle element. Deferring capture to this point (rather than
            // pointerdown) lets a plain tap fall through to its real target,
            // so interactive children inside the sheet stay clickable.
            try {
                (event.currentTarget as Element).setPointerCapture(event.pointerId);
            } catch {
                // setPointerCapture can throw in jsdom; the gesture still works
                // via the move/up handlers, so swallow and continue.
            }
            setDragging(true);
        }
        g.lastY = event.clientY;
        g.lastTime = event.timeStamp;
        // Clamp to downward-only travel (SHEET-03); upward over-pull is a no-op.
        setOffset(Math.max(0, delta));
    };

    const endDrag = (event: React.PointerEvent) => {
        const g = gesture.current;
        if (!g.active) return;
        g.active = false;
        setDragging(false);
        const finalOffset = Math.max(0, event.clientY - g.startY);
        const elapsed = event.timeStamp - g.lastTime;
        const velocity = elapsed > 0 ? (event.clientY - g.lastY) / elapsed : 0;
        const sheetHeight = sectionRef.current
            ? sectionRef.current.getBoundingClientRect().height
            : 0;
        const outcome = dragDecision({
            offset: finalOffset,
            sheetHeight,
            velocity,
            maskClosable,
        });
        if (outcome === "dismiss") {
            // Animate the section out then close. The transition lives under
            // .my-recipes-fast-overlay so reduced-motion users get an instant
            // dismiss (the 1ms clamp).
            setOffset(sheetHeight || finalOffset);
            onClose();
        } else {
            // Spring back to rest.
            setOffset(0);
        }
    };

    if (!open) return null;

    // Backdrop alpha fades from its rest value (0.30) toward 0 as the sheet is
    // dragged down, giving the iOS "content fades as it leaves" feel (SHEET-01).
    const sheetHeightForFade = sectionRef.current
        ? sectionRef.current.getBoundingClientRect().height
        : 0;
    const dragProgress = sheetHeightForFade > 0 ? Math.min(1, offset / sheetHeightForFade) : 0;
    const backdropAlpha = 0.3 * (1 - dragProgress);
    const dragHandleProps = (origin: DragOrigin) => ({
        "data-drag-handle": true,
        className: "my-recipes-fast-overlay__handle",
        onPointerDown: beginDrag(origin),
        onPointerMove: onDragMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
    });

    return createPortal(
        <div
            className="my-recipes-fast-overlay"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: resolvedZIndex,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                background: `rgba(16, 24, 40, ${backdropAlpha})`,
                animation: dragging || offset > 0 ? "none" : backdropInAnimation,
                transition: dragging ? "none" : "background 220ms " + overlayMotionEase,
                willChange: "opacity",
            }}
            onMouseDown={(event) => {
                if (maskClosable && event.target === event.currentTarget) onClose();
            }}
        >
            {overlayMotionStyles}
            {sheetStyles}
            <section
                ref={sectionRef}
                className="my-recipes-fast-overlay__sheet"
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                data-testid={testId}
                onKeyDown={onTrapKeyDown}
                style={{
                    width: "100%",
                    maxWidth: 720,
                    maxHeight: toCssSize(height, "min(85vh, 720px)"),
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderTop: "1px solid rgba(232, 237, 245, 0.96)",
                    borderRadius: "18px 18px 0 0",
                    background: "linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)",
                    boxShadow: "0 -16px 48px rgba(74, 48, 130, 0.24)",
                    animation: dragging || offset > 0 ? "none" : sheetInAnimation,
                    transform: `translate3d(0, ${offset}px, 0)`,
                    transition: dragging ? "none" : "transform 220ms " + overlayMotionEase,
                    transformOrigin: "bottom center",
                    willChange: "transform",
                    outline: "none",
                }}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    aria-label="Kéo để đóng"
                    style={grabberStyle}
                    {...dragHandleProps("grabber")}
                >
                    <span aria-hidden="true" style={grabberPillStyle} />
                </button>
                <div
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 14px 12px 16px", borderBottom: "1px solid rgba(116, 54, 220, 0.10)", background: "rgba(255,255,255,0.72)" }}
                    {...dragHandleProps("header")}
                >
                    <div style={shellTitleStyle}>{title}</div>
                    {closable && <button type="button" aria-label="Đóng" onClick={onClose} style={closeButtonStyle}>
                        <CloseOutlined />
                    </button>}
                </div>
                <div
                    ref={bodyRef}
                    className="my-recipes-fast-overlay__body"
                    style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column" }}
                    onPointerDown={beginDrag("body")}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                >
                    {children}
                </div>
            </section>
        </div>,
        document.body,
    );
};

// Horizontal action row for sheets and inline confirm panels (06-UI-SPEC):
// one action stretches full width; two+ actions sit side by side with equal
// flex so neither overflows on phone widths. Each direct child is wrapped so
// the row controls sizing without the caller setting flex on every Button.
export type SheetActionsProps = {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    "data-testid"?: string;
};

export const SheetActions: React.FunctionComponent<SheetActionsProps> = ({
    children,
    style,
    "data-testid": testId,
}) => {
    const items = React.Children.toArray(children).filter(Boolean);
    return (
        <div
            data-testid={testId}
            style={{
                display: "flex",
                alignItems: "stretch",
                gap: 8,
                width: "100%",
                ...style,
            }}
        >
            {items.map((child, index) => {
                // Stretch each action to share the row equally; a single action
                // therefore fills the full width (06-UI-SPEC sheet-action rule).
                if (React.isValidElement(child)) {
                    const childStyle = (child.props as { style?: React.CSSProperties }).style;
                    return React.cloneElement(child as React.ReactElement, {
                        key: index,
                        style: { flex: "1 1 0", minWidth: 0, ...childStyle },
                    });
                }
                return (
                    <div key={index} style={{ flex: "1 1 0", minWidth: 0 }}>
                        {child}
                    </div>
                );
            })}
        </div>
    );
};
