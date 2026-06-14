// COPY_GLOSSARY — REVIEW-ONLY artifact (D-04, D-05).
//
// This constant documents the ONE canonical Vietnamese term per concept so that
// terminology stays consistent across screens (no synonym drift). It is a review
// reference only: it MUST NOT be imported by runtime code, wired into any provider,
// hook, or lookup, or enforced by tooling. Reviewing it before the Phase 5 wording
// pass surfaces synonym conflicts.
//
// Term values are [ASSUMED] placeholders pending Phase 5 household-user validation;
// the structure (one canonical `term` per concept) is what locks here.
//
// Security note: never list a credential (GitHub PAT, admin PIN) as a term — flag any
// concept that would reference a secret during review.

export const COPY_GLOSSARY = {
    // concept: { canonical Vietnamese term, synonyms to avoid, usage note }
    todaysMeal: {
        term: "Bữa hôm nay",
        avoid: ["Bữa ăn hôm nay", "Bữa ăn"],
        note: "nav + screens + toasts must agree on this phrasing",
    },
    dish: {
        term: "Món",
        avoid: ["Món ăn (in lists)"],
        note: "use the short form in list/grid contexts",
    },
    addAction: {
        term: "Thêm",
        avoid: ["Tạo mới", "Thêm mới"],
        note: "single verb for all add/create entry points",
    },
    skip: {
        term: "Tùy bạn",
        avoid: ["Bỏ qua", "Bất kỳ"],
        note: "wizard skip framing — soft, not a dismissive 'skip'",
    },
    heroPrompt: {
        term: "Hôm nay ăn gì?",
        avoid: [],
        note: "Home hero CTA — the entry question of the meal journey",
    },
} as const;
