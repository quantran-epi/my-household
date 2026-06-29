/**
 * Pure drag-decision logic for the native iOS-feel bottom sheet.
 *
 * DOM-free by design (no React, no browser APIs, no mutation/IO) so every
 * branch is exhaustively unit-testable under Jest/jsdom with plain object
 * inputs. The pointer-handler shell (FastOverlay Sheet) is responsible for
 * translating finger movement into the inputs consumed here.
 *
 * Branch enumeration is canonical to 07-RESEARCH.md
 * §"Scroll-vs-Drag Branch Enumeration" (B1-B6, D1-D4).
 */

/** Where the pointerdown that may begin a drag originated. */
export type DragOrigin = "grabber" | "header" | "body";

/** Vertical direction of the first move sample. */
export type DragDirection = "up" | "down";

/** Outcome of a released drag gesture. */
export type DragOutcome = "dismiss" | "spring-back";

/**
 * Downward flick velocity threshold in px/ms. A release at or above this
 * speed dismisses the sheet even if it has not passed the distance
 * threshold (07-RESEARCH.md D3). Tunable.
 */
export const VELOCITY_FLICK = 0.5;

/**
 * Fraction of sheet height the drag must travel to dismiss on distance
 * alone (07-RESEARCH.md D2). ~40% past the open position.
 */
const DISMISS_OFFSET_RATIO = 0.4;

/**
 * Decide whether a pointerdown should begin a drag gesture at all.
 *
 * Implements branches B1-B6 from 07-RESEARCH.md exactly:
 * - B1 grabber  → true  (always a drag handle)
 * - B2 header   → true  (always a drag handle)
 * - B3 body, scrollTop===0, down → true  (at top + pulling down = dismiss)
 * - B4 body, scrollTop===0, up   → false (nothing to scroll, not a dismiss)
 * - B5 body, scrollTop>0,  down  → false (native scroll wins; do not hijack)
 * - B6 body, scrollTop>0,  up    → false (native scroll)
 */
export const shouldStartDrag = (
    origin: DragOrigin,
    scrollTop: number,
    direction: DragDirection,
): boolean => {
    // B1 + B2: grabber and header are always drag handles regardless of
    // scroll position or direction.
    if (origin === "grabber" || origin === "header") return true;

    // origin === "body" from here on.
    // B3: only a downward pull while already scrolled to the top begins a
    // drag. B4/B5/B6 all fall through to false (let native scroll win).
    return scrollTop === 0 && direction === "down";
};

/** Inputs to the release decision. */
export type DragDecisionInput = {
    /** Downward travel in px. Clamped >= 0 upstream (SHEET-03). */
    offset: number;
    /** Total sheet height in px used for the distance threshold. */
    sheetHeight: number;
    /** Downward release velocity in px/ms (downward positive). */
    velocity: number;
    /** When false the sheet is protected and must never drag-dismiss. */
    maskClosable: boolean;
};

/**
 * Decide whether a released drag dismisses the sheet or springs it back.
 *
 * Evaluation order is strict (07-RESEARCH.md D1-D4):
 * - D1 maskClosable === false → 'spring-back' (short-circuits before D2/D3)
 * - D2 offset >= 0.40 * sheetHeight → 'dismiss'
 * - D3 velocity >= VELOCITY_FLICK → 'dismiss'
 * - D4 otherwise → 'spring-back'
 *
 * offset is assumed non-negative (clamped upstream); the inclusive `>=`
 * comparisons mean a negative offset can never satisfy D2/D3 for a
 * positive sheetHeight, so an upward drag never dismisses.
 */
export const dragDecision = ({
    offset,
    sheetHeight,
    velocity,
    maskClosable,
}: DragDecisionInput): DragOutcome => {
    // D1: protected sheets never drag-dismiss. Must come first so it beats
    // both the distance and velocity checks (SHEET-04).
    if (maskClosable === false) return "spring-back";

    // D2: past the distance threshold.
    if (offset >= DISMISS_OFFSET_RATIO * sheetHeight) return "dismiss";

    // D3: fast downward flick even if the distance was short.
    if (velocity >= VELOCITY_FLICK) return "dismiss";

    // D4: didn't pass distance or velocity → return to open.
    return "spring-back";
};
