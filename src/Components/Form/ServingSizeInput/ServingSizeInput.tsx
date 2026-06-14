import { NumberStepper } from "@components/Form/NumberStepper";
import React from "react";

type ServingSizeInputProps = {
    value?: number | string | null;
    onChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    disabled?: boolean;
    size?: "small" | "middle" | "large";
    style?: React.CSSProperties;
    inputStyle?: React.CSSProperties;
}

const toNumber = (value: unknown, fallback: number): number => {
    const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    return isFinite(parsed) ? parsed : fallback;
};

const normalize = (value: unknown, min: number, max?: number): number => {
    const parsed = toNumber(value, min);
    const withMin = Math.max(min, parsed);
    return typeof max === "number" ? Math.min(max, withMin) : withMin;
};

export const ServingSizeInput: React.FunctionComponent<ServingSizeInputProps> = ({
    value,
    onChange,
    min = 1,
    max,
    step = 1,
    precision = 0,
    disabled,
    size = "middle",
    style,
    inputStyle,
}) => {
    const currentValue = normalize(value, min, max);
    return <NumberStepper
        aria-label="khẩu phần"
        value={currentValue}
        onChange={next => onChange?.(normalize(next, min, max))}
        min={min}
        max={max}
        step={step}
        precision={precision}
        disabled={disabled}
        size={size}
        style={style}
        inputStyle={inputStyle}
    />
}
