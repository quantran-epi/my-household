// Diacritic-insensitive normalize for Vietnamese option/label filtering (D-07).
// NFD-decomposes, strips the combining-mark range, then explicitly replaces đ/Đ
// (which do NOT decompose under NFD — searching "do" otherwise fails to match "đỏ"),
// then lowercases. ReDoS-safe: callers filter with String.includes, never a
// user-built regex.
export const normalizeDiacritics = (s: string): string =>
    s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
