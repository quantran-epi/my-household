import { iosTokens } from './iosTokens';
import { safeAreaInset } from './safeArea';

// Value-pinning tests (guards Pitfall 4 — tokenization must not silently shift a pixel
// or normalize a literal). Every assertion below pins a token to its verbatim Phase 7/8
// source literal.

describe('iosTokens.spacing', () => {
    test('exposes the 4px-rhythm scale', () => {
        expect(iosTokens.spacing).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 });
    });
});

describe('iosTokens.radius', () => {
    test('exposes the promoted radius scale', () => {
        expect(iosTokens.radius).toEqual({ sm: 6, md: 10, lg: 14, xl: 18, xxl: 20, pill: 999 });
    });
    test('xl is the 18px sheet top-corner radius', () => {
        expect(iosTokens.radius.xl).toBe(18);
    });
});

describe('iosTokens.type', () => {
    test('control role deep-equals SheetTrigger base style values', () => {
        expect(iosTokens.type.control).toEqual({ fontSize: 16, fontWeight: 400, lineHeight: '22px' });
    });
    test('body fontSize is the AntD base 18', () => {
        expect(iosTokens.type.body.fontSize).toBe(18);
    });
    test('fontFamily is the verbatim App.tsx system-ui stack', () => {
        expect(iosTokens.type.fontFamily).toBe('system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
    });
});

describe('iosTokens.color', () => {
    test('promotes the existing purple set verbatim', () => {
        expect(iosTokens.color.primary).toBe('#7436dc');
        expect(iosTokens.color.primaryHover).toBe('#8f46f7');
        expect(iosTokens.color.primaryActive).toBe('#5e2bbf');
        expect(iosTokens.color.borderIdle).toBe('#d9d9d9');
        expect(iosTokens.color.text).toBe('#2f2545');
        expect(iosTokens.color.textMuted).toBe('#6b6478');
        expect(iosTokens.color.destructive).toBe('#ff4d4f');
        expect(iosTokens.color.accentFill).toBe('rgba(116, 54, 220, 0.10)');
    });
});

describe('iosTokens.surface', () => {
    test('sheetGradient equals the FastOverlay sheet gradient', () => {
        expect(iosTokens.surface.sheetGradient).toBe('linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)');
    });
    test('contentGradient equals the Content app-body gradient', () => {
        expect(iosTokens.surface.contentGradient).toBe('linear-gradient(180deg, #e9e3f4 0%, #f6f3fb 52%, #ffffff 100%)');
    });
    test('shadowNav equals the BottomTabNavigator dock shadow', () => {
        expect(iosTokens.surface.shadowNav).toBe('0 14px 34px rgba(74, 48, 130, 0.18), 0 5px 12px rgba(74, 48, 130, 0.08)');
    });
});

describe('iosTokens.motion', () => {
    test('ease is the overlay transition curve', () => {
        expect(iosTokens.motion.ease).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    });
});

describe('iosTokens.touchTarget', () => {
    test('min is 44 and comfortable is 52', () => {
        expect(iosTokens.touchTarget.min).toBe(44);
        expect(iosTokens.touchTarget.comfortable).toBe(52);
    });
});

describe('iosTokens.layout', () => {
    test('promotes the header/nav layout heights', () => {
        expect(iosTokens.layout.headerHeight).toBe(76);
        expect(iosTokens.layout.bottomNavHeight).toBe(80);
        expect(iosTokens.layout.bottomNavContainerMinHeight).toBe(88);
    });
});

describe('safeAreaInset', () => {
    test('bottom(8) string-equals the BottomTabNavigator:37 literal', () => {
        expect(safeAreaInset.bottom(8)).toBe('calc(8px + env(safe-area-inset-bottom))');
    });
    test('top(0) composes the top-inset calc string', () => {
        expect(safeAreaInset.top(0)).toBe('calc(0px + env(safe-area-inset-top))');
    });
});
