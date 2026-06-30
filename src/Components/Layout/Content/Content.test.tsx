import { render } from '@testing-library/react';
import { Content } from './Content';

// Regression guard for the IOS-02 safe-area shell bug this phase fixes (D-05).
// The scrollable content box height is emitted via a scoped <style> block (#app-content)
// because a single inline style object cannot carry two `height` keys (the vh→dvh cascade).
// AntD also injects its own <style> elements, so select the one scoped to #app-content.
const readContentCss = (): string => {
    const styleEls = Array.from(document.querySelectorAll('style'));
    const scoped = styleEls.find(el => (el.textContent ?? '').includes('#app-content'));
    return scoped?.textContent ?? '';
};

test('content height subtracts BOTH safe-area insets (Pitfall 1 — missing insets)', () => {
    render(<Content>child</Content>);
    const css = readContentCss();
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('env(safe-area-inset-bottom)');
});

test('content height uses the dvh primary unit with a vh fallback, never mixing them in one declaration (Pitfall 2 — unit mismatch)', () => {
    render(<Content>child</Content>);
    const css = readContentCss();
    // dvh is the winning declaration; vh is the first-declared fallback (FastOverlay cascade).
    expect(css).toContain('100dvh');
    expect(css).toContain('100vh');
    // No single height rule may contain BOTH unit families — each line is one family.
    const heightLines = css
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('height:'));
    expect(heightLines.length).toBeGreaterThanOrEqual(2);
    heightLines.forEach(line => {
        const hasVh = /\b100vh\b/.test(line);
        const hasDvh = /\b100dvh\b/.test(line);
        expect(hasVh && hasDvh).toBe(false);
    });
});

test('content box renders with md padding from tokens (not the removed local CONTENT_PADDING const)', () => {
    const { getByTestId } = render(<Content>child</Content>);
    const box = getByTestId('app-content');
    // jsdom does not serialize the complex linear-gradient background into the inline
    // style attribute, so padding (a plain px value) is the token-sourced value we can assert.
    expect(box.style.padding).toBe('12px');
});
