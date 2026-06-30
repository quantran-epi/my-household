// Safe-area inset convention (IOS-02, CONTEXT D-07).
//
// ONE convention for all sticky chrome. The reference implementation is
// BottomTabNavigator.tsx:37 (`calc(8px + env(safe-area-inset-bottom))`); all sticky
// bottom chrome converges on this `calc(... + env())` shape. The function shape (vs a
// fixed string set) is Claude's discretion per CONTEXT — chosen so callers pass a
// numeric base and the helper composes the calc() string.

export const safeAreaInset = {
    bottom: (base: number) => `calc(${base}px + env(safe-area-inset-bottom))`,
    top: (base: number) => `calc(${base}px + env(safe-area-inset-top))`,
} as const;
