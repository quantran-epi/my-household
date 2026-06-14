/**
 * @common/Copy — typed Vietnamese copy foundation (barrel).
 *
 * Re-exports:
 *   - AppCopy      : source-of-truth copy object (as const, nested namespaces)
 *   - CopyKey      : derived dot-path union (build-time key safety, COPY-01)
 *   - COPY_GLOSSARY: review-only terminology reference (COPY-02; NOT runtime-wired)
 *
 * Screens read copy via direct object access (D-07), e.g.
 *   import { AppCopy } from "@common/Copy";
 *   AppCopy.wizard.heroPrompt;
 *   AppCopy.wizard.greeting({ name });
 * There is no runtime key-lookup helper (direct object access only, D-07) — the
 * CopyKey union exists for build-time proof and to type any future helper.
 *
 * ---------------------------------------------------------------------------
 * Phase 5 migration recipe (D-08) — locate un-migrated inline Vietnamese strings.
 *
 * List files containing user-facing Vietnamese-diacritic double-quoted string
 * literals across the Phase 5 migration targets (--pcre2 for the character class):
 *
 *   rg -l --pcre2 \
 *     '"[^"]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][^"]*"' \
 *     src/Modules src/Routing/MasterPage.tsx
 *
 * Notes:
 *   - Verified this phase: matches 62 files (~2490 candidate lines with -n instead of -l).
 *   - Matches double-quoted literals (the dominant form in src/ per CONVENTIONS.md).
 *   - For full coverage, Phase 5 should also run single-quote and JSX-text variants;
 *     the double-quote pass above is the primary entry point.
 *   - The simpler `'"[^"]*\p{Script=Latin}[^"]*"'` over-matches English; `\p{M}`
 *     misses precomposed Vietnamese chars — the explicit class above is the reliable recipe.
 * ---------------------------------------------------------------------------
 */
export * from './AppCopy';
export * from './Glossary';
