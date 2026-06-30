// iOS visual baseline tokens (IOS-01, CONTEXT D-01/D-02/D-03).
//
// Single source of truth for the Phase 7/8 visual literals. Every value below is
// promoted VERBATIM from a shipped literal in the codebase — this module centralizes
// the duplicated style constants, it does NOT introduce a new visual language (D-02).
// Source call sites: App.tsx, SheetTrigger.tsx, BottomTabNavigator.tsx,
// FastOverlay.tsx, Content.tsx.
//
// `as const` is REQUIRED: tsconfig has `strict: false` + `target: es5`, so without it
// a typo'd token path silently resolves to `undefined` instead of failing type-check
// (Pitfall 6). Categories are deliberately lightweight (YAGNI, D-03).

export const iosTokens = {
    // Spacing scale — multiples of 4, anchored to the iOS HIG ~8pt rhythm.
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        xxxl: 48,
    },

    // Radius scale — promoted from existing literals. xl (18) is the sheet top-corner radius (D-03).
    radius: {
        sm: 6,
        md: 10,
        lg: 14,
        xl: 18,
        xxl: 20,
        pill: 999,
    },

    // Typography — verbatim system-ui stack from App.tsx:29; control role from SheetTrigger:34-36.
    type: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        control: { fontSize: 16, fontWeight: 400, lineHeight: '22px' },
        body: { fontSize: 18 },
    },

    // Color — promotes the existing purple set (App.tsx ConfigProvider + SheetTrigger). No overhaul (D-03).
    color: {
        primary: '#7436dc',
        primaryHover: '#8f46f7',
        primaryActive: '#5e2bbf',
        borderIdle: '#d9d9d9',
        text: '#2f2545',
        textMuted: '#6b6478',
        destructive: '#ff4d4f',
        accentFill: 'rgba(116, 54, 220, 0.10)',
    },

    // Surface — promoted verbatim from FastOverlay/Content/BottomTabNavigator (no AntD slot).
    surface: {
        sheetGradient: 'linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)',
        contentGradient: 'linear-gradient(180deg, #e9e3f4 0%, #f6f3fb 52%, #ffffff 100%)',
        shadowNav: '0 14px 34px rgba(74, 48, 130, 0.18), 0 5px 12px rgba(74, 48, 130, 0.08)',
    },

    // Motion — overlay transition easing (FastOverlay).
    motion: {
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },

    // Touch targets (IOS-03) — min 44 (trigger/sheet rows), comfortable 52 (nav tabs/pill).
    touchTarget: {
        min: 44,
        comfortable: 52,
    },

    // Layout — promoted HEADER_HEIGHT / BOTTOM_NAV_HEIGHT; nav container min-height is 88.
    layout: {
        headerHeight: 76,
        bottomNavHeight: 80,
        bottomNavContainerMinHeight: 88,
    },
} as const;
