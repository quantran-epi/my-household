import { InputNumber as AntInputNumber, InputNumberProps } from "antd";
import { NumberHelpers } from "@common/Helpers/NumberHelpers";
import React from "react";

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>((props, ref) => {
    return <AntInputNumber
        ref={ref}
        formatter={value => NumberHelpers.formatWithSeparator(value)}
        parser={value => NumberHelpers.parseSeparator(value)}
        {...props}
    />;
});
