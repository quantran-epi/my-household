import { MoreOutlined } from "@ant-design/icons";
import { Button } from "@components/Button";
import { Dropdown } from "antd";
import { usePageActionsState } from "../PageActionsContext";
import { headerActionButtonStyle } from "./shellStyles";

export const PageActionsMenu = () => {
    const actions = usePageActionsState();
    if (actions.length === 0) return null;
    return <Dropdown
        trigger={["click"]}
        placement="bottomRight"
        menu={{
            items: actions.map(action => ({
                key: action.key,
                label: action.label,
                icon: action.icon,
                danger: action.danger,
                disabled: action.disabled,
                onClick: action.onClick,
            })),
        }}
    >
        <Button
            type="text"
            aria-label="Thao tác trang"
            data-testid="page-actions-button"
            icon={<MoreOutlined style={{ fontSize: 20 }} />}
            style={headerActionButtonStyle}
        />
    </Dropdown>;
}
