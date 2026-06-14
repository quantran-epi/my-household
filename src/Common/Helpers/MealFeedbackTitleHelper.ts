import type { CookingMealFeedbackSlot } from "@store/Models/CookingSession";

type MealSlotLabelStyle = "short" | "full";
type MealFeedbackSlotValue = CookingMealFeedbackSlot | string;

const actionPrefixes = [
    "Phản hồi",
    "Hoàn tất",
    "Nấu",
    "Ăn",
    "Chuẩn bị",
    "Finish",
    "Finished",
    "Complete",
    "Completed",
    "Cook",
    "Cooking",
    "Feedback",
    "Review",
];

const slotLabels: Record<CookingMealFeedbackSlot, { short: string; full: string; phrases: string[] }> = {
    breakfast: { short: "Sáng", full: "Bữa sáng", phrases: ["bữa sáng", "sáng", "breakfast"] },
    lunch: { short: "Trưa", full: "Bữa trưa", phrases: ["bữa trưa", "trưa", "lunch"] },
    dinner: { short: "Tối", full: "Bữa tối", phrases: ["bữa tối", "tối", "dinner"] },
    day: { short: "Cả ngày", full: "Cả ngày", phrases: ["cả ngày", "ngày", "day"] },
    dish: { short: "Món", full: "Món riêng", phrases: ["món riêng", "món", "dish"] },
};

const actionPrefixPattern = new RegExp(`^(${actionPrefixes.join("|")})\\s+`, "i");

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slotPhrases = Object.entries(slotLabels)
    .flatMap(([slot, config]) => config.phrases.map(phrase => ({ slot: slot as CookingMealFeedbackSlot, phrase })))
    .sort((a, b) => b.phrase.length - a.phrase.length);

const findSlotPrefix = (value: string): { slot: CookingMealFeedbackSlot; end: number } | null => {
    for (const item of slotPhrases) {
        const match = value.match(new RegExp(`^${escapeRegExp(item.phrase)}(?=\\s*(?:[-:·]|$))`, "i"));
        if (match) return { slot: item.slot, end: match[0].length };
    }
    return null;
};

const getSlotConfig = (slot?: MealFeedbackSlotValue) => {
    if (!slot) return undefined;
    return slotLabels[slot as CookingMealFeedbackSlot];
};

export const MealFeedbackTitleHelper = {
    getSlotLabel(slot?: MealFeedbackSlotValue, style: MealSlotLabelStyle = "full"): string {
        return getSlotConfig(slot)?.[style] ?? "Bữa ăn";
    },

    normalize(title?: string, slot?: MealFeedbackSlotValue, style: MealSlotLabelStyle = "full"): string {
        const trimmed = title?.trim();
        if (!trimmed) return "";

        const withoutAction = trimmed.replace(actionPrefixPattern, "").trim();
        if (withoutAction === trimmed) return trimmed;

        const slotMatch = findSlotPrefix(withoutAction);
        if (!slotMatch) return withoutAction;

        const remainder = withoutAction.slice(slotMatch.end).replace(/^\s*[-:·]\s*/, "").trim();
        if (remainder) return remainder;

        return MealFeedbackTitleHelper.getSlotLabel(slot ?? slotMatch.slot, style);
    },
};
