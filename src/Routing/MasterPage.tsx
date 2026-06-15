import { CloudDownloadOutlined, CloudUploadOutlined, DatabaseOutlined, ExportOutlined, ImportOutlined, LockOutlined, MedicineBoxOutlined, MenuOutlined, UnlockOutlined, QuestionCircleOutlined, SearchOutlined, LoadingOutlined, SyncOutlined, SettingOutlined } from "@ant-design/icons";
import { ObjectPropertyHelper } from "@common/Helpers/ObjectProperty";
import { getStorageString, setStorageString } from "@common/Storage/AppStorage";
import { SharedSyncModal } from "@components/AppInitializer/SharedSyncModal";
import { ActionButton, Button } from "@components/Button";
import { FastDrawerShell } from "@components/FastOverlay";
import { TextArea } from "@components/Form/Input";
import { Image } from "@components/Image";
import { Box } from "@components/Layout/Box";
import { Content } from "@components/Layout/Content";
import { Header } from "@components/Layout/Header";
import { Space } from "@components/Layout/Space";
import { Stack } from "@components/Layout/Stack";
import { useMessage } from "@components/Message";
import { DeferredModalContent, Modal } from "@components/Modal";
import { useModal } from "@components/Modal/ModalProvider";
import { SmartForm, useSmartForm } from "@components/SmartForm";
import { Tooltip } from "@components/Tootip";
import { Typography } from "@components/Typography";
import { useAdminMode, useToggle, useOnlineStatus, useSharedPublish, useSharedDataSync, type SyncedVersions } from "@hooks";
import { ScheduledMealToolkitWidget } from "@modules/ScheduledMeal/Screens/ScheduledMealToolkit.widget";
import { GistBackupWidget } from "@components/GistBackupWidget";
import { GlobalSearchScreen } from "@modules/Home/Screens/GlobalSearch.screen";
import { isUserGuideWelcomeComplete } from "@modules/Home/Screens/UserGuideOnboardingStorage";
import { selectCurrentFeatureName, selectInventoryHealthConfig } from "@store/Selectors";
import { NumberStepper } from "@components/Form/NumberStepper";
import { Flex, Input as AntInput, Layout, Divider } from "antd";
import React, { useState } from "react";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LogoIcon from "../../assets/icons/logo.png";
import HouseIcon from "../../assets/icons/house.png";
import FamilyIcon from "../../assets/icons/family.png";
import DietPlanIcon from "../../assets/icons/diet-plan.png";
import ChatIcon from "../../assets/icons/chat.png";
import LeftoverIcon from "../../assets/icons/leftover.png";
import CookingHistoryIcon from "../../assets/icons/history.png";
import PrepTaskIcon from "../../assets/icons/clock (1).png";
import DishesIcon from "../../assets/icons/noodles.png";
import ShoppingListIcon from "../../assets/icons/shoppingList.png";
import IngredientIcon from "../../assets/icons/vegetable.png";
import SuggesterIcon from "../../assets/icons/cooking.png";
import BudgetIcon from "../../assets/icons/budget.png";
import MonitorIcon from "../../assets/icons/monitor.png";
import LayoutIcon from "../../assets/icons/layout.png";
import MedicalRecordIcon from "../../assets/icons/medical-record.png";
import NutritionPlanIcon from "../../assets/icons/nutrition-plan.png";
import { INGREDIENT_PRESERVATION_OPTIONS, INGREDIENT_SHELF_LIFE_OPTIONS, IngredientPreservationCondition, IngredientShelfLife } from "@store/Models/Ingredient";
import { DEFAULT_INVENTORY_HEALTH_CONFIG, InventoryHealthConfig, normalizeInventoryHealthConfig } from "@store/Models/SharedConfig";
import { updateInventoryConfig } from "@store/Reducers/SharedConfigReducer";
import { AppShellNavigationProvider, useAppShellNavigation, useAppShellNavigationController } from "./AppShellNavigationContext";
import { RootRoutes } from "./RootRoutes";
import { BottomTabNavigator } from "./Shell/BottomTabNavigator";
import { CookingPill } from "./Shell/CookingPill";
import { PageActionsMenu } from "./Shell/PageActionsMenu";
import { headerActionButtonStyle } from "./Shell/shellStyles";

const layoutStyles: React.CSSProperties = {
    height: "100%"
}

const drawerToolsPlaceholderStyle: React.CSSProperties = {
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8f46f7",
};

const sidebarNavListStyle: React.CSSProperties = {
    padding: "10px 8px 8px",
};

const sidebarNavGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 14,
};

const sidebarNavSectionLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#9b8fb5",
    padding: "0 12px",
    marginBottom: 4,
};

const APP_CONFIRM_Z_INDEX = 5200;

type HeaderVisual = {
    tone: string;
    shadow: string;
}

const defaultHeaderVisual: HeaderVisual = {
    tone: "#8d46f6",
    shadow: "rgba(95,43,191,0.22)",
};

const headerVisualByFeatureName: Record<string, HeaderVisual> = {
    "Tổng quan": { tone: "#7436dc", shadow: "rgba(95,43,191,0.24)" },
    "Nguyên liệu": { tone: "#389e0d", shadow: "rgba(44,128,56,0.22)" },
    "Món ăn": { tone: "#fa541c", shadow: "rgba(190,79,30,0.22)" },
    "Nấu gì?": { tone: "#13a8a8", shadow: "rgba(19,130,130,0.22)" },
    "Nhà mình": { tone: "#1677ff", shadow: "rgba(22,88,210,0.23)" },
    "Lập thực đơn": { tone: "#13a8a8", shadow: "rgba(19,130,130,0.22)" },
    "Thực đơn": { tone: "#1677ff", shadow: "rgba(22,88,210,0.23)" },
    "Lịch mua sắm": { tone: "#0958d9", shadow: "rgba(9,88,217,0.24)" },
    "Tính chi phí": { tone: "#d46b08", shadow: "rgba(180,92,18,0.23)" },
    "Phân tích": { tone: "#2f54eb", shadow: "rgba(47,84,235,0.23)" },
    "Dinh dưỡng": { tone: "#13a8a8", shadow: "rgba(19,130,130,0.22)" },
    "Mẫu dùng lại": { tone: "#fa8c16", shadow: "rgba(196,105,22,0.22)" },
    "Sức khỏe dữ liệu": { tone: "#cf1322", shadow: "rgba(176,32,48,0.22)" },
    "Hướng dẫn": { tone: "#8f46f7", shadow: "rgba(95,43,191,0.22)" },
    "Tour hướng dẫn": { tone: "#8f46f7", shadow: "rgba(95,43,191,0.22)" },
    "Chào mừng": { tone: "#8f46f7", shadow: "rgba(95,43,191,0.22)" },
};

const getHeaderVisualByPath = (pathname: string): HeaderVisual | null => {
    if (pathname.includes("/ingredient")) return headerVisualByFeatureName["Nguyên liệu"];
    if (pathname.includes("/dishes")) return headerVisualByFeatureName["Món ăn"];
    if (pathname.includes("/dish-suggester")) return headerVisualByFeatureName["Nấu gì?"];
    if (pathname.includes("/household")) return headerVisualByFeatureName["Nhà mình"];
    if (pathname.includes("/smart-meal-planner")) return headerVisualByFeatureName["Lập thực đơn"];
    if (pathname.includes("/scheduledMeal")) return headerVisualByFeatureName["Thực đơn"];
    if (pathname.includes("/shoppingList")) return headerVisualByFeatureName["Lịch mua sắm"];
    if (pathname.includes("/expense-planner")) return headerVisualByFeatureName["Tính chi phí"];
    if (pathname.includes("/analytics")) return headerVisualByFeatureName["Phân tích"];
    if (pathname.includes("/nutrition-goals")) return headerVisualByFeatureName["Dinh dưỡng"];
    if (pathname.includes("/templates")) return headerVisualByFeatureName["Mẫu dùng lại"];
    if (pathname.includes("/sync-backup-health")) return headerVisualByFeatureName["Sức khỏe dữ liệu"];
    if (pathname.includes("/guide")) return headerVisualByFeatureName["Hướng dẫn"];
    return null;
};

const getHeaderVisual = (featureName: string, pathname: string): HeaderVisual => {
    return getHeaderVisualByPath(pathname) ?? headerVisualByFeatureName[featureName] ?? defaultHeaderVisual;
};

const createHeaderBackground = (visual: HeaderVisual) => `linear-gradient(135deg, ${visual.tone} 0%, #7436dc 58%, #5e2bbf 100%)`;

const getHeaderDateLabel = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}, ${month} ${date.getFullYear()}`;
};

const sidebarNavButtonStyle = (active: boolean): React.CSSProperties => ({
    width: "100%",
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    border: active ? "1px solid rgba(116, 54, 220, 0.16)" : "1px solid transparent",
    borderRadius: 8,
    background: active ? "linear-gradient(135deg, #f5f0ff 0%, #ffffff 100%)" : "transparent",
    color: active ? "#5e2bbf" : "#2f2545",
    font: "inherit",
    fontSize: 16,
    fontWeight: active ? 650 : 500,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: active ? "0 8px 18px rgba(116, 54, 220, 0.10)" : "none",
});

const useDeferredDrawerTools = (open: boolean) => {
    const [ready, setReady] = React.useState(false);
    const frameRefs = React.useRef<number[]>([]);

    const clearFrames = React.useCallback(() => {
        frameRefs.current.forEach(frame => window.cancelAnimationFrame(frame));
        frameRefs.current = [];
    }, []);

    React.useEffect(() => {
        clearFrames();
        setReady(false);
        if (!open) return;

        const firstFrame = window.requestAnimationFrame(() => {
            const secondFrame = window.requestAnimationFrame(() => {
                frameRefs.current = [];
                setReady(true);
            });
            frameRefs.current.push(secondFrame);
        });
        frameRefs.current.push(firstFrame);

        return clearFrames;
    }, [clearFrames, open]);

    return ready;
};

export const MasterPage = () => {
    const currentFeatureName = useSelector(selectCurrentFeatureName);
    const { isOnline } = useOnlineStatus();
    const toggleSearch = useToggle();
    const location = useLocation();
    const navigate = useNavigate();
    const appShellNavigation = useAppShellNavigationController(location.pathname, navigate);
    const headerVisual = getHeaderVisual(currentFeatureName, location.pathname);

    React.useEffect(() => {
        const welcomeRoute = RootRoutes.AuthorizedRoutes.UserGuideWelcome();
        if (location.pathname === welcomeRoute) return;
        if (isUserGuideWelcomeComplete()) return;
        navigate(welcomeRoute, { replace: true });
    }, [location.pathname, navigate]);

    React.useEffect(() => {
        const content = document.getElementById("app-content");
        if (!content) return;
        content.scrollTop = 0;
        content.scrollTo({ top: 0, behavior: "auto" });
    }, [location.pathname]);

    return <AppShellNavigationProvider value={appShellNavigation}>
        <Layout style={layoutStyles}>
            <Header style={{
                height: 76,
                lineHeight: "normal",
                padding: "10px 12px 12px",
                background: createHeaderBackground(headerVisual),
                borderBottom: 0,
                boxShadow: `0 12px 26px ${headerVisual.shadow}`,
                color: "#fff",
                zIndex: 10,
            }}>
                <Stack justify="space-between" align="center" gap={10} style={{ height: "100%" }}>
                    <Stack align="center" gap={9} style={{ minWidth: 0, flex: "1 1 auto" }}>
                        <SidebarDrawer buttonStyle={headerActionButtonStyle} />
                        <div style={{ minWidth: 0 }}>
                            <Typography.Text style={{ display: "block", color: "rgba(255,255,255,0.82)", fontSize: 11, lineHeight: "14px", fontWeight: 650 }}>My Recipes</Typography.Text>
                            <Tooltip title={currentFeatureName}>
                                <Typography.Paragraph style={{ fontSize: 18, lineHeight: "22px", fontWeight: 750, marginBottom: 0, maxWidth: "min(190px, calc(100vw - 210px))", color: "#fff" }} ellipsis>{currentFeatureName}</Typography.Paragraph>
                            </Tooltip>
                        </div>
                    </Stack>
                    <Stack align="center" gap={6} style={{ flexShrink: 0 }}>
                        <span style={{ borderRadius: 999, padding: "5px 9px", background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {getHeaderDateLabel()}
                        </span>
                        <Button
                            type="text"
                            aria-label="Tìm kiếm toàn cục"
                            data-testid="global-search-button"
                            icon={<SearchOutlined style={{ fontSize: 18 }} />}
                            onClick={toggleSearch.show}
                            style={headerActionButtonStyle}
                        />
                        <PageActionsMenu />
                    </Stack>
                </Stack>
            </Header>
            <Content>
                {!isOnline && (
                    <div style={{
                        background: '#fffbe6',
                        borderBottom: '1px solid #ffe58f',
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: '#7c6000',
                    }}>
                        <span>📴</span>
                        <span>Không có mạng — Dữ liệu vẫn được lưu cục bộ</span>
                    </div>
                )}
                <Outlet />
            </Content>
            <BottomTabNavigator />
            <CookingPill />
            {toggleSearch.value && <GlobalSearchScreen open={toggleSearch.value} onClose={toggleSearch.hide} onNavigate={appShellNavigation.navigateWithFeedback} />}
        </Layout>
    </AppShellNavigationProvider>
}

const SidebarDrawer = ({ buttonStyle }: { buttonStyle?: React.CSSProperties }) => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [pinError, setPinError] = useState("");
    const { isAdmin, tryUnlock, lock } = useAdminMode();
    const {
        publishSharedData,
        isPublishing,
        lastPublishAt,
        githubToken,
        setGithubToken,
        clearGithubToken,
        hasGithubToken,
        githubTokenSource,
        testGithubToken,
        isTestingGithubToken,
    } = useSharedPublish();
    const { pendingSync, isSyncChecking, checkNow, dismissSync, markSynced } = useSharedDataSync();
    const message = useMessage();
    const modal = useModal();
    const toggleBackupCenter = useToggle();
    const { navigateWithFeedback } = useAppShellNavigation();
    const toolsReady = useDeferredDrawerTools(open);
    const location = useLocation();
    const [publishTokenInput, setPublishTokenInput] = useState(githubToken);
    const inventoryConfig = useSelector(selectInventoryHealthConfig);
    const [inventoryConfigDraft, setInventoryConfigDraft] = useState<InventoryHealthConfig>(() => normalizeInventoryHealthConfig(inventoryConfig));

    React.useEffect(() => {
        setPublishTokenInput(githubToken);
    }, [githubToken]);

    React.useEffect(() => {
        if (!toggleBackupCenter.value) return;
        setInventoryConfigDraft(normalizeInventoryHealthConfig(inventoryConfig));
    }, [toggleBackupCenter.value, inventoryConfig]);

    const showDrawer = () => {
        setOpen(true);
    };

    const resetPinState = () => {
        setPin("");
        setPinError("");
    };

    const onClose = () => {
        setOpen(false);
        setPinModalOpen(false);
        resetPinState();
    };

    const onNavigate = (href: string) => {
        navigateWithFeedback(href, () => setOpen(false));
    }

    const onUnlock = async () => {
        if (await tryUnlock(pin)) {
            setPinModalOpen(false);
            setPin("");
            setPinError("");
            window.location.reload();
        } else {
            setPinError("Sai mã PIN");
        }
    };

    const onLock = async () => {
        await lock();
        window.location.reload();
    };

    const onImportCloud = async () => {
        try {
            const nextPendingSync = await checkNow({ force: true });
            if (nextPendingSync) {
                setOpen(false);
                toggleBackupCenter.hide();
            } else {
                message.success("Dữ liệu dùng chung đã mới nhất");
            }
        } catch (ex: any) {
            message.error("Đồng bộ thất bại: " + ex?.message);
        }
    };

    const onSharedSyncDone = async (synced: SyncedVersions) => {
        await markSynced(synced);
        message.success("Đồng bộ dữ liệu dùng chung thành công");
    };

    const onSavePublishToken = async () => {
        await setGithubToken(publishTokenInput);
        message.success("Đã lưu GitHub token xuất bản trên thiết bị này");
    };

    const onClearPublishToken = async () => {
        await clearGithubToken();
        setPublishTokenInput("");
        message.success("Đã xoá GitHub token xuất bản trên thiết bị này");
    };

    const onTestPublishToken = () => {
        testGithubToken(publishTokenInput);
    };

    const onPublishSharedData = () => {
        modal.confirm({
            title: "Xác nhận xuất bản dữ liệu dùng chung",
            content: "Thao tác này sẽ ghi nguyên liệu, món ăn và cấu hình dùng chung lên GitHub để các thiết bị khác đồng bộ. Bạn có chắc muốn xuất bản dữ liệu hiện tại?",
            okText: "Xuất bản",
            cancelText: "Hủy",
            centered: true,
            zIndex: APP_CONFIRM_Z_INDEX,
            onOk: publishSharedData,
        });
    };

    const updateInventoryConfigNumber = (key: "lowStockAmount" | "urgentExpiryDays", value: number | null) => {
        setInventoryConfigDraft(prev => normalizeInventoryHealthConfig({
            ...prev,
            [key]: typeof value === "number" ? value : 0,
        }));
    };

    const updateExpirationDefault = (shelfLife: IngredientShelfLife, preservationCondition: IngredientPreservationCondition, value: number | null) => {
        setInventoryConfigDraft(prev => normalizeInventoryHealthConfig({
            ...prev,
            expirationDefaults: {
                ...prev.expirationDefaults,
                [shelfLife]: {
                    ...prev.expirationDefaults[shelfLife],
                    [preservationCondition]: typeof value === "number" ? value : 0,
                },
            },
        }));
    };

    const resetInventoryConfigDraft = () => {
        setInventoryConfigDraft(normalizeInventoryHealthConfig(DEFAULT_INVENTORY_HEALTH_CONFIG));
    };

    const saveInventoryConfig = () => {
        dispatch(updateInventoryConfig(inventoryConfigDraft));
        message.success("Đã lưu cấu hình tồn kho dùng chung");
    };

    const publishTokenSaved = publishTokenInput.trim() === githubToken;
    const publishTokenStatusText = githubTokenSource === "local"
        ? "Đang dùng token lưu trên thiết bị này."
        : githubTokenSource === "build"
            ? "Đang dùng token cấu hình sẵn. Bạn có thể nhập token khác để ghi đè trên thiết bị này."
            : "Chưa có token xuất bản. Token chỉ lưu trong trình duyệt của thiết bị này.";

    const sidebarNavGroups = [
        {
            key: 'overview',
            label: 'Tổng quan',
            items: [
                { key: 'dashboard', href: RootRoutes.AuthorizedRoutes.Root(), icon: HouseIcon, label: 'Tổng quan' },
                { key: 'analytics', href: RootRoutes.AuthorizedRoutes.Analytics(), icon: MonitorIcon, label: 'Phân tích' },
            ],
        },
        {
            key: 'planning',
            label: 'Lên thực đơn',
            items: [
                { key: 'dishSuggester', href: RootRoutes.AuthorizedRoutes.DishSuggester(), icon: SuggesterIcon, label: 'Nấu gì?' },
                { key: 'meals', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.List(), icon: DietPlanIcon, label: 'Thực đơn' },
                { key: 'dishFeedback', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.FeedbackHistory(), icon: ChatIcon, label: 'Phản hồi món' },
                { key: 'cookingHistory', href: RootRoutes.AuthorizedRoutes.CookingHistory(), icon: CookingHistoryIcon, label: 'Lịch sử nấu ăn' },
                { key: 'leftovers', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.Leftovers(), icon: LeftoverIcon, label: 'Phần còn lại' },
                { key: 'prepTasks', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.PrepTasks(), icon: PrepTaskIcon, label: 'Việc chuẩn bị' },
                { key: 'shoppingList', href: RootRoutes.AuthorizedRoutes.ShoppingListRoutes.List(), icon: ShoppingListIcon, label: 'Lịch mua sắm' },
                { key: 'expensePlanner', href: RootRoutes.AuthorizedRoutes.ExpensePlanner(), icon: BudgetIcon, label: 'Tính chi phí' },
            ],
        },
        {
            key: 'library',
            label: 'Thư viện',
            items: [
                { key: 'dishes', href: RootRoutes.AuthorizedRoutes.DishesRoutes.List(), icon: DishesIcon, label: 'Món ăn' },
                { key: 'ingredients', href: RootRoutes.AuthorizedRoutes.IngredientRoutes.List(), icon: IngredientIcon, label: 'Nguyên liệu' },
                { key: 'templates', href: RootRoutes.AuthorizedRoutes.Templates(), icon: LayoutIcon, label: 'Mẫu dùng lại' },
            ],
        },
        {
            key: 'household',
            label: 'Gia đình',
            items: [
                { key: 'household', href: RootRoutes.AuthorizedRoutes.HouseholdProfiles(), icon: FamilyIcon, label: 'Nhà mình' },
                { key: 'nutritionGoals', href: RootRoutes.AuthorizedRoutes.NutritionGoals(), icon: NutritionPlanIcon, label: 'Dinh dưỡng' },
            ],
        },
    ];

    return (
        <React.Fragment>
            <Button type="text" data-testid="sidebar-drawer-button" onClick={showDrawer} icon={<MenuOutlined style={{ fontSize: 18 }} />} style={buttonStyle} />
            <FastDrawerShell
                title={
                    <Flex align="center" gap={10}>
                        <span style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #8f46f7 0%, #5e2bbf 100%)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 18px rgba(116,54,220,0.22)" }}>
                            <Image src={LogoIcon} width={25} loading="eager" alt="My Recipes" />
                        </span>
                        <div style={{ minWidth: 0 }}>
                            <Typography.Text style={{ display: "block", fontSize: 18, lineHeight: "22px", fontWeight: 750, color: "#2f2545" }}>My Recipes</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px" }}>Bếp nhà hôm nay</Typography.Text>
                        </div>
                    </Flex>
                }
                onClose={onClose}
                open={open}
                data-testid="sidebar-drawer"
                width="min(360px, calc(100vw - 38px))"
            >
                {/* ── Navigation ── */}
                <div data-testid="sidebar-drawer-primary-nav">
                    <div style={sidebarNavListStyle}>
                        {sidebarNavGroups.map(group => (
                            <div key={group.key} style={sidebarNavGroupStyle} data-testid={`sidebar-nav-group-${group.key}`}>
                                <div style={sidebarNavSectionLabelStyle}>{group.label}</div>
                                {group.items.map(item => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        data-testid={`sidebar-nav-${item.key}`}
                                        style={sidebarNavButtonStyle(location.pathname === item.href)}
                                        onClick={() => onNavigate(item.href)}
                                    >
                                        <Image src={item.icon} width={24} alt="" />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <Box data-testid="sidebar-drawer-tools" style={{ padding: "0 16px 24px" }}>
                    {!toolsReady ? <div style={drawerToolsPlaceholderStyle}><LoadingOutlined /></div> : <React.Fragment>

                    {/* ── Data center ── */}
                    <Divider orientation="left" style={{ fontSize: 12, color: "#888", marginTop: 16, marginBottom: 12 }}>Dữ liệu</Divider>
                    <Flex vertical gap={8}>
                        <Button
                            icon={<DatabaseOutlined />}
                            block
                            onClick={toggleBackupCenter.show}
                        >
                            Dữ liệu & sao lưu
                        </Button>
                        <Button
                            icon={<MedicineBoxOutlined />}
                            block
                            onClick={() => onNavigate(RootRoutes.AuthorizedRoutes.SyncBackupHealth())}
                        >
                            Sức khỏe dữ liệu
                        </Button>
                        <Typography.Text type="secondary" style={{ fontSize: 11, paddingLeft: 2 }}>
                            Đồng bộ dùng chung, sao lưu cá nhân và trạng thái backup được gom vào một nơi.
                        </Typography.Text>
                    </Flex>

                    {/* ── Help ── */}
                    <Divider orientation="left" style={{ fontSize: 12, color: "#888", marginTop: 20, marginBottom: 12 }}>Trợ giúp</Divider>
                    <Button
                        icon={<QuestionCircleOutlined />}
                        block
                        onClick={() => onNavigate(RootRoutes.AuthorizedRoutes.UserGuide())}
                    >
                        Hướng dẫn sử dụng
                    </Button>

                    {/* ── Account ── */}
                    <Divider orientation="left" style={{ fontSize: 12, color: "#888", marginTop: 20, marginBottom: 12 }}>Tài khoản</Divider>
                    <Flex vertical gap={4}>
                        {isAdmin ? (
                            <>
                                <Flex align="center" justify="space-between" style={{ padding: "4px 0" }}>
                                    <Flex align="center" gap={6}>
                                        <LockOutlined style={{ color: "#52c41a" }} />
                                        <Typography.Text style={{ fontSize: 13, color: "#52c41a", fontWeight: 500 }}>Đang ở chế độ Admin</Typography.Text>
                                    </Flex>
                                    <Button type="text" danger onClick={onLock}>Khoá</Button>
                                </Flex>
                                <Typography.Text type="secondary" style={{ fontSize: 11, paddingLeft: 2 }}>
                                    Nhấn "Khoá" để thoát chế độ admin và ẩn các công cụ quản trị.
                                </Typography.Text>
                            </>
                        ) : (
                            <>
                                <Button type="text" icon={<UnlockOutlined />} block onClick={() => setPinModalOpen(true)} style={{ justifyContent: "flex-start" }}>
                                    Đăng nhập Admin
                                </Button>
                                <Typography.Text type="secondary" style={{ fontSize: 11, paddingLeft: 2 }}>
                                    Nhập mã PIN để mở quyền thêm / sửa / xoá nguyên liệu và món ăn.
                                </Typography.Text>
                            </>
                        )}
                    </Flex>

                    </React.Fragment>}

                </Box>
            </FastDrawerShell>
            <Modal
                title="Nhập mã PIN"
                open={pinModalOpen}
                onOk={onUnlock}
                onCancel={() => { setPinModalOpen(false); setPin(""); setPinError(""); }}
                okText="Xác nhận"
                cancelText="Huỷ"
                destroyOnClose
            >
                <Flex vertical gap={8}>
                    <AntInput.Password
                        placeholder="Nhập PIN"
                        value={pin}
                        onChange={e => { setPin(e.target.value); setPinError(""); }}
                        onPressEnter={onUnlock}
                    />
                    {pinError && <Typography.Text type="danger">{pinError}</Typography.Text>}
                </Flex>
            </Modal>
            <Modal
                title={<Space><DatabaseOutlined style={{ color: "#7436dc" }} />Dữ liệu & sao lưu</Space>}
                open={toggleBackupCenter.value}
                onCancel={toggleBackupCenter.hide}
                footer={null}
                width="min(720px, calc(100vw - 24px))"
                destroyOnClose={false}
            >
                <DeferredModalContent active={toggleBackupCenter.value} minHeight={280}>
                    {toggleBackupCenter.value ? <Flex vertical gap={12}>
                        <Box style={{ border: "1px solid rgba(116,54,220,0.12)", borderRadius: 8, padding: 10, background: "#fbf9ff" }}>
                            <Stack justify="space-between" align="flex-start" gap={8}>
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: "block", color: "#2f2545", fontSize: 15, lineHeight: "20px" }}>Dữ liệu dùng chung</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px" }}>
                                        Cập nhật nguyên liệu, món ăn, mục tiêu dinh dưỡng và cấu hình tồn kho mới nhất được admin xuất bản.
                                    </Typography.Text>
                                </div>
                                <ActionButton tone="primary" icon={<CloudDownloadOutlined />} loading={isSyncChecking} onClick={onImportCloud}>
                                    Đồng bộ mới
                                </ActionButton>
                            </Stack>
                        </Box>

                        {isAdmin && <Box style={{ border: "1px solid rgba(116,54,220,0.14)", borderRadius: 8, padding: 10, background: "#fff" }}>
                            <Flex vertical gap={10}>
                                <Flex align="flex-start" gap={8}>
                                    <span style={{ width: 34, height: 34, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#7436dc", background: "rgba(116,54,220,0.12)", flexShrink: 0 }}>
                                        <SettingOutlined />
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <Typography.Text strong style={{ display: "block", color: "#2f2545", fontSize: 15, lineHeight: "20px" }}>Cấu hình tồn kho dùng chung</Typography.Text>
                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px" }}>
                                            Thiết lập ngưỡng cảnh báo tồn kho và hạn dùng mặc định cho lô hàng chưa nhập ngày hết hạn riêng.
                                        </Typography.Text>
                                    </div>
                                </Flex>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                                    <Box style={{ border: "1px solid #f0f0f0", borderRadius: 0, padding: 9, background: "#fbf9ff" }}>
                                        <Typography.Text strong style={{ display: "block", fontSize: 12, marginBottom: 5 }}>Ngưỡng thiếu hàng</Typography.Text>
                                        <NumberStepper
                                            min={0}
                                            step={0.5}
                                            value={inventoryConfigDraft.lowStockAmount}
                                            onChange={value => updateInventoryConfigNumber("lowStockAmount", value)}
                                            style={{ width: "100%" }}
                                        />
                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px", marginTop: 5 }}>
                                            Tồn kho lớn hơn 0 và nhỏ hơn hoặc bằng số này sẽ được xem là thấp.
                                        </Typography.Text>
                                    </Box>
                                    <Box style={{ border: "1px solid #f0f0f0", borderRadius: 0, padding: 9, background: "#fbf9ff" }}>
                                        <Typography.Text strong style={{ display: "block", fontSize: 12, marginBottom: 5 }}>Sắp hết hạn trong</Typography.Text>
                                        <NumberStepper
                                            min={0}
                                            step={1}
                                            value={inventoryConfigDraft.urgentExpiryDays}
                                            onChange={value => updateInventoryConfigNumber("urgentExpiryDays", value)}
                                            style={{ width: "100%" }}
                                        />
                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px", marginTop: 5 }}>
                                            Lô hàng còn trong khoảng ngày này sẽ được ưu tiên cảnh báo và gợi ý nấu trước.
                                        </Typography.Text>
                                    </Box>
                                </div>

                                <Flex vertical gap={8}>
                                    <Typography.Text strong style={{ fontSize: 13, color: "#2f2545" }}>Hạn dùng mặc định theo bảo quản</Typography.Text>
                                    {INGREDIENT_SHELF_LIFE_OPTIONS.map(shelfLife => (
                                        <Box key={shelfLife.value} style={{ border: "1px solid #f0f0f0", borderRadius: 0, padding: 9, background: "#fff" }}>
                                            <Typography.Text strong style={{ display: "block", fontSize: 12, lineHeight: "16px", marginBottom: 7 }}>{shelfLife.label}</Typography.Text>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 7 }}>
                                                {INGREDIENT_PRESERVATION_OPTIONS.map(condition => (
                                                    <div key={condition.value}>
                                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px", marginBottom: 3 }}>{condition.label}</Typography.Text>
                                                        <NumberStepper
                                                            min={0}
                                                            step={1}
                                                            value={inventoryConfigDraft.expirationDefaults[shelfLife.value][condition.value]}
                                                            onChange={value => updateExpirationDefault(shelfLife.value, condition.value, value)}
                                                            style={{ width: "100%" }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </Box>
                                    ))}
                                </Flex>

                                <Flex gap={8} wrap="wrap" justify="flex-end">
                                    <ActionButton onClick={resetInventoryConfigDraft}>Dùng mặc định</ActionButton>
                                    <ActionButton tone="primary" onClick={saveInventoryConfig}>Lưu cấu hình</ActionButton>
                                </Flex>
                            </Flex>
                        </Box>}

                        {isAdmin && <Box style={{ border: "1px solid rgba(82,196,26,0.18)", borderRadius: 8, padding: 10, background: "#fcfff8" }}>
                            <Flex vertical gap={8}>
                                <Typography.Text strong style={{ display: "block", color: "#245822", fontSize: 15, lineHeight: "20px" }}>Quản trị xuất bản</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: "17px" }}>
                                    Đẩy nguyên liệu, món ăn và cấu hình dùng chung hiện tại lên GitHub để các thiết bị khác đồng bộ thủ công.
                                </Typography.Text>
                                <AntInput.Password
                                    autoComplete="off"
                                    placeholder="Token có quyền ghi repo contents"
                                    value={publishTokenInput}
                                    onChange={e => setPublishTokenInput(e.target.value)}
                                />
                                <Flex gap={8} wrap="wrap">
                                    <ActionButton disabled={publishTokenSaved} onClick={onSavePublishToken}>
                                        Lưu token
                                    </ActionButton>
                                    <ActionButton loading={isTestingGithubToken} disabled={!publishTokenInput.trim() && !hasGithubToken} onClick={onTestPublishToken}>
                                        Kiểm tra token
                                    </ActionButton>
                                    <ActionButton tone="danger" disabled={!githubToken} onClick={onClearPublishToken}>
                                        Xoá token
                                    </ActionButton>
                                </Flex>
                                <Typography.Text type="secondary" style={{ fontSize: 11, lineHeight: "16px" }}>
                                    {publishTokenStatusText}
                                </Typography.Text>
                                <ActionButton
                                    tone="success"
                                    icon={<CloudUploadOutlined />}
                                    loading={isPublishing}
                                    disabled={!hasGithubToken}
                                    onClick={onPublishSharedData}
                                    style={{ color: "#52c41a", borderColor: "#52c41a" }}
                                >
                                    Xuất bản dữ liệu dùng chung
                                </ActionButton>
                                {lastPublishAt && <Typography.Text type="secondary" style={{ fontSize: 11, color: "#52c41a" }}>
                                    Xuất bản lần cuối: {new Date(lastPublishAt).toLocaleString("vi-VN")}
                                </Typography.Text>}
                            </Flex>
                        </Box>}

                        <Box style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fff" }}>
                            <Stack justify="space-between" align="flex-start" gap={8} style={{ marginBottom: 6 }}>
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: "block", color: "#2f2545", fontSize: 15, lineHeight: "20px" }}>Sao lưu cá nhân</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px" }}>
                                        Sao lưu tồn kho, lịch mua sắm, thực đơn và mẫu dùng lại vào GitHub Gist.
                                    </Typography.Text>
                                </div>
                                <ActionButton icon={<SyncOutlined />} onClick={() => { toggleBackupCenter.hide(); onNavigate(RootRoutes.AuthorizedRoutes.SyncBackupHealth()); }}>
                                    Xem sức khỏe
                                </ActionButton>
                            </Stack>
                            <GistBackupWidget />
                        </Box>
                    </Flex> : null}
                </DeferredModalContent>
            </Modal>
            <ScheduledMealToolkitWidget onNavigate={onNavigate} />
            {pendingSync && (
                <SharedSyncModal
                    open={true}
                    manifest={pendingSync.manifest}
                    hasIngredientChanges={pendingSync.hasIngredientChanges}
                    hasDishChanges={pendingSync.hasDishChanges}
                    hasConfigChanges={pendingSync.hasConfigChanges}
                    force={pendingSync.force}
                    onDone={onSharedSyncDone}
                    onCancel={dismissSync}
                />
            )}
        </React.Fragment>
    );
};

export const DataBackup = ({ onImportCloud }: { onImportCloud?: () => Promise<void> }) => {
    const toggleShowData = useToggle();
    const toggleImportData = useToggle();
    const [exportedData, setExportedData] = useState<string>("");
    const message = useMessage();
    const toggleImportingCloud = useToggle();

    // Restore personal data from a raw or base64-encoded persisted personal root.
    const _restorePersonalFromText = async (text: string) => {
        try {
            const trimmed = text.trim();
            let decoded = trimmed;
            try {
                decoded = decodeURIComponent(escape(atob(trimmed)));
            } catch { }
            JSON.parse(decoded);
            await setStorageString("persist:personal", decoded);
            message.success("Khôi phục thành công! Đang tải lại...");
            setTimeout(() => window.location.reload(), 1200);
        } catch (ex) {
            message.error("Khôi phục thất bại: dữ liệu không hợp lệ");
        }
    };

    const _onImportCloud = async () => {
        if (onImportCloud) return onImportCloud();
        toggleImportingCloud.show();
        try {
            const res = await fetch(
                "https://raw.githubusercontent.com/quantran-epi/my-recipes/refs/heads/main/docs/data.txt?t=" + Date.now()
            );
            const text = await res.text();
            await _restorePersonalFromText(text);
        } catch (ex: any) {
            message.error("Import thất bại: " + ex?.message);
        } finally {
            toggleImportingCloud.hide();
        }
    };

    const importDataForm = useSmartForm({
        defaultValues: { data: "" },
        onSubmit: (values) => {
            _restorePersonalFromText(values.transformValues.data);
        },
        itemDefinitions: defaultValues => ({
            data: { name: ObjectPropertyHelper.nameof(defaultValues, e => e.data), label: "Data (base64)" }
        })
    });

    return <React.Fragment>
        <Space>
            <Button icon={<ExportOutlined />} onClick={async () => {
                setExportedData(await getStorageString("persist:personal") ?? "");
                toggleShowData.show();
            }}>Export</Button>

            <Button icon={<ImportOutlined />} onClick={toggleImportData.show}>Import</Button>

            <Button loading={toggleImportingCloud.value} icon={<CloudDownloadOutlined />} onClick={_onImportCloud}>Import cloud</Button>
        </Space>

        <Modal title="Export — dữ liệu cá nhân" open={toggleShowData.value} onCancel={toggleShowData.hide} footer={null}>
            <DeferredModalContent active={toggleShowData.value} minHeight={320}>
                {toggleShowData.value ? <React.Fragment>
                    <Box style={{ height: 300, overflowY: "auto", wordBreak: "break-all", fontSize: 12 }}>
                        {exportedData}
                    </Box>
                    <br />
                    <CopyToClipboard text={exportedData} onCopy={() => message.success("Copied")}>
                        <Stack justify="flex-end"><ActionButton>Copy</ActionButton></Stack>
                    </CopyToClipboard>
                </React.Fragment> : null}
            </DeferredModalContent>
        </Modal>

        <Modal title="Import — dữ liệu cá nhân" open={toggleImportData.value} onCancel={toggleImportData.hide} footer={null}>
            <DeferredModalContent active={toggleImportData.value} minHeight={240}>
                {toggleImportData.value ? <React.Fragment>
                    <SmartForm {...importDataForm.defaultProps}>
                        <SmartForm.Item {...importDataForm.itemDefinitions.data}>
                            <TextArea rows={10} />
                        </SmartForm.Item>
                    </SmartForm>
                </React.Fragment> : null}
            </DeferredModalContent>
            <ActionButton onClick={importDataForm.submit}>Khôi phục</ActionButton>
        </Modal>
    </React.Fragment>
}
