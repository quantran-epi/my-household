export const NumberHelpers = {
    isBetween: (value: number, from: number, to: number, include = true) => {
        return include ? (value >= from && value <= to) : (value > from && value < to);
    },
    formatWithSeparator: (value: string | number | undefined | null): string => {
        if (value === undefined || value === null || value === "") return "";
        const raw = String(value);
        const negative = raw.startsWith("-");
        const unsigned = negative ? raw.slice(1) : raw;
        const [intPart, decPart] = unsigned.split(".");
        const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const result = decPart !== undefined ? `${groupedInt}.${decPart}` : groupedInt;
        return negative ? `-${result}` : result;
    },
    parseSeparator: (value: string | undefined): string => {
        return value ? value.replace(/,/g, "") : "";
    },
}