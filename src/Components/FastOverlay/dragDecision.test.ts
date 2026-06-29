import { shouldStartDrag, dragDecision, VELOCITY_FLICK } from './dragDecision';

// Concrete fixture: a 400px sheet makes the 40% distance threshold exactly 160px.
const SHEET_HEIGHT = 400;
const DISMISS_OFFSET = 0.4 * SHEET_HEIGHT; // 160

describe('shouldStartDrag', () => {
    it('B1: grabber origin always begins a drag', () => {
        expect(shouldStartDrag('grabber', 0, 'down')).toBe(true);
        expect(shouldStartDrag('grabber', 250, 'up')).toBe(true);
    });

    it('B2: header origin always begins a drag', () => {
        expect(shouldStartDrag('header', 0, 'up')).toBe(true);
        expect(shouldStartDrag('header', 250, 'down')).toBe(true);
    });

    it('B3: body at scrollTop===0 pulling down begins a drag', () => {
        expect(shouldStartDrag('body', 0, 'down')).toBe(true);
    });

    it('B4: body at scrollTop===0 pulling up does not begin a drag', () => {
        expect(shouldStartDrag('body', 0, 'up')).toBe(false);
    });

    it('B5: body scrolled (scrollTop>0) pulling down does not begin a drag (native scroll wins)', () => {
        expect(shouldStartDrag('body', 120, 'down')).toBe(false);
    });

    it('B6: body scrolled (scrollTop>0) pulling up does not begin a drag', () => {
        expect(shouldStartDrag('body', 120, 'up')).toBe(false);
    });
});

describe('dragDecision', () => {
    it('D1: maskClosable===false springs back', () => {
        expect(
            dragDecision({ offset: 0, sheetHeight: SHEET_HEIGHT, velocity: 0, maskClosable: false }),
        ).toBe('spring-back');
    });

    it('D2: offset at/above 40% of sheetHeight dismisses', () => {
        expect(
            dragDecision({ offset: DISMISS_OFFSET + 50, sheetHeight: SHEET_HEIGHT, velocity: 0, maskClosable: true }),
        ).toBe('dismiss');
    });

    it('D3: velocity >= VELOCITY_FLICK dismisses on a short drag', () => {
        expect(
            dragDecision({ offset: 20, sheetHeight: SHEET_HEIGHT, velocity: VELOCITY_FLICK + 0.5, maskClosable: true }),
        ).toBe('dismiss');
    });

    it('D4: sub-threshold offset and velocity springs back', () => {
        expect(
            dragDecision({ offset: 20, sheetHeight: SHEET_HEIGHT, velocity: 0, maskClosable: true }),
        ).toBe('spring-back');
    });

    it('D1 short-circuit ordering: maskClosable===false beats past-threshold offset AND flick velocity', () => {
        expect(
            dragDecision({
                offset: 0.9 * SHEET_HEIGHT,
                sheetHeight: SHEET_HEIGHT,
                velocity: VELOCITY_FLICK + 1,
                maskClosable: false,
            }),
        ).toBe('spring-back');
    });

    it('offset boundary: exactly 40% of sheetHeight dismisses (>= is inclusive)', () => {
        expect(
            dragDecision({ offset: DISMISS_OFFSET, sheetHeight: SHEET_HEIGHT, velocity: 0, maskClosable: true }),
        ).toBe('dismiss');
    });

    it('offset boundary: just below 40% of sheetHeight springs back', () => {
        expect(
            dragDecision({ offset: DISMISS_OFFSET - 1, sheetHeight: SHEET_HEIGHT, velocity: 0, maskClosable: true }),
        ).toBe('spring-back');
    });

    it('velocity boundary: exactly VELOCITY_FLICK dismisses (>= is inclusive)', () => {
        expect(
            dragDecision({ offset: 10, sheetHeight: SHEET_HEIGHT, velocity: VELOCITY_FLICK, maskClosable: true }),
        ).toBe('dismiss');
    });

    it('velocity boundary: just below VELOCITY_FLICK with sub-threshold offset springs back', () => {
        expect(
            dragDecision({
                offset: 10,
                sheetHeight: SHEET_HEIGHT,
                velocity: VELOCITY_FLICK - 0.01,
                maskClosable: true,
            }),
        ).toBe('spring-back');
    });

    it('clamp guard: negative offset with positive sheetHeight and sub-threshold velocity never dismisses', () => {
        expect(
            dragDecision({ offset: -120, sheetHeight: SHEET_HEIGHT, velocity: 0, maskClosable: true }),
        ).toBe('spring-back');
    });
});
