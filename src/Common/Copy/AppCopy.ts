// AppCopy — the single source of truth for user-facing Vietnamese strings.
//
// Structure (locked this phase; phrasing is [ASSUMED] placeholder content
// pending Phase 5 household-user validation):
//   - common:      shared actions/messages reused across screens
//   - wizard:      seeds for the Phase 4 "what to cook" guided flow
//   - emptyStates: friendly empty-state scaffold for Phase 5
//
// Conventions (D-01..D-09):
//   - One PascalCase const object, declared `as const`, so every leaf is a
//     literal type and a typo'd key is a compile error (D-01, D-02).
//   - Interpolated strings are arrow functions taking a single required
//     named-arg object, so a dropped dynamic value is a TS2345 error (D-03, D-09).
//   - Screens read copy via direct object access (e.g. `AppCopy.wizard.heroPrompt`)
//     — no hook, no provider, no runtime lookup helper (D-07).
//   - Zero dependencies: no imports, no default export.
//
// `CopyKey` (below) is a build-time-safety proof and a type for any future
// helper — it is NOT used at screen call sites (D-02, D-07).

export const AppCopy = {
    common: {
        save: "Lưu",
        cancel: "Hủy",
        add: "Thêm",
        back: "Quay lại",
        skip: "Tùy bạn",
        error: "Lỗi hệ thống, vui lòng thử lại sau",
        success: "Xử lý thành công",
    },
    wizard: {
        heroPrompt: "Hôm nay ăn gì?",
        greeting: (args: { name: string }) => `Chào ${args.name}, nhà mình ăn gì nhỉ?`,
        stepIntro: "Cùng chọn món cho hôm nay nhé",
        skipLabel: "Tùy bạn",
        resultTitle: "Gợi ý cho nhà mình",
        addToToday: "Thêm vào hôm nay",
        addedToToday: (args: { dishName: string }) => `Đã thêm ${args.dishName} vào hôm nay`,
    },
    emptyStates: {
        noDishes: "Chưa có món nào — thêm món đầu tiên nhé",
        noSchedule: "Chưa có bữa nào được lên lịch — bắt đầu nhé",
        noInventory: "Chưa có nguyên liệu nào trong bếp",
    },
} as const;

// Functions are treated as leaves (same as plain strings).
type Primitive = string | number | boolean | ((...args: any[]) => any);

// Recursive dot-path union over the copy object. Leaf-only variant
// (RESEARCH Open-Q1 default — marginally stricter): namespace tokens like
// "wizard" are not themselves valid keys, only their leaves are.
type CopyPath<T, Prefix extends string = ""> = {
    [K in keyof T & string]: T[K] extends Primitive
        ? `${Prefix}${K}`
        : CopyPath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type CopyKey = CopyPath<typeof AppCopy>;
