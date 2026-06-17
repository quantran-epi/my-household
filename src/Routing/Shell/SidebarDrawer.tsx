import { CloudDownloadOutlined, CloudUploadOutlined, DatabaseOutlined, LockOutlined, MedicineBoxOutlined, MenuOutlined, UnlockOutlined, QuestionCircleOutlined, LoadingOutlined, SyncOutlined, SettingOutlined } from "@ant-design/icons";
import { AppCopy } from "@common/Copy";
import { SharedSyncModal } from "@components/AppInitializer/SharedSyncModal";
import { ActionButton, Button } from "@components/Button";
import { FastDrawerShell } from "@components/FastOverlay";
import { Image } from "@components/Image";
import { Box } from "@components/Layout/Box";
import { Space } from "@components/Layout/Space";
import { Stack } from "@components/Layout/Stack";
import { useMessage } from "@components/Message";
import { DeferredModalContent } from "@components/Modal";
import { useModal } from "@components/Modal/ModalProvider";
import { Sheet } from "@components/Sheet";
import { Typography } from "@components/Typography";
import { useAdminMode, useToggle, useSharedPublish, useSharedDataSync, type SyncedVersions } from "@hooks";
import { ScheduledMealToolkitWidget } from "@modules/ScheduledMeal/Screens/ScheduledMealToolkit.widget";
import { GistBackupWidget } from "@components/GistBackupWidget";
import { selectInventoryHealthConfig } from "@store/Selectors";
import { NumberStepper } from "@components/Form/NumberStepper";
import { Flex, Input as AntInput, Divider } from "antd";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import LogoIcon from "../../../assets/icons/logo.png";
import HouseIcon from "../../../assets/icons/house.png";
import FamilyIcon from "../../../assets/icons/family.png";
import DietPlanIcon from "../../../assets/icons/diet-plan.png";
import ChatIcon from "../../../assets/icons/chat.png";
import LeftoverIcon from "../../../assets/icons/leftover.png";
import CookingHistoryIcon from "../../../assets/icons/history.png";
import PrepTaskIcon from "../../../assets/icons/clock (1).png";
import DishesIcon from "../../../assets/icons/noodles.png";
import ShoppingListIcon from "../../../assets/icons/shoppingList.png";
import IngredientIcon from "../../../assets/icons/vegetable.png";
import SuggesterIcon from "../../../assets/icons/cooking.png";
import BudgetIcon from "../../../assets/icons/budget.png";
import MonitorIcon from "../../../assets/icons/monitor.png";
import LayoutIcon from "../../../assets/icons/layout.png";
import NutritionPlanIcon from "../../../assets/icons/nutrition-plan.png";
import { INGREDIENT_PRESERVATION_OPTIONS, INGREDIENT_SHELF_LIFE_OPTIONS, IngredientPreservationCondition, IngredientShelfLife } from "@store/Models/Ingredient";
import { DEFAULT_INVENTORY_HEALTH_CONFIG, InventoryHealthConfig, normalizeInventoryHealthConfig } from "@store/Models/SharedConfig";
import { updateInventoryConfig } from "@store/Reducers/SharedConfigReducer";
import { useAppShellNavigation } from "../AppShellNavigationContext";
import { RootRoutes } from "../RootRoutes";

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

export const SidebarDrawer = ({ buttonStyle }: { buttonStyle?: React.CSSProperties }) => {
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
            setPinError(AppCopy.shell.pinWrong);
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
                message.success(AppCopy.shell.backupSharedUpToDate);
            }
        } catch (ex: any) {
            message.error(AppCopy.shell.backupSyncFailed({ reason: ex?.message }));
        }
    };

    const onSharedSyncDone = async (synced: SyncedVersions) => {
        await markSynced(synced);
        message.success(AppCopy.shell.backupSyncSuccess);
    };

    const onSavePublishToken = async () => {
        await setGithubToken(publishTokenInput);
        message.success(AppCopy.shell.publishTokenSaved);
    };

    const onClearPublishToken = async () => {
        await clearGithubToken();
        setPublishTokenInput("");
        message.success(AppCopy.shell.publishTokenCleared);
    };

    const onTestPublishToken = () => {
        testGithubToken(publishTokenInput);
    };

    const onPublishSharedData = () => {
        modal.confirm({
            title: AppCopy.shell.publishConfirmTitle,
            content: AppCopy.shell.publishConfirmBody,
            okText: AppCopy.shell.publishConfirmOk,
            cancelText: AppCopy.common.cancel,
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
        message.success(AppCopy.shell.inventorySaved);
    };

    const publishTokenSaved = publishTokenInput.trim() === githubToken;
    const publishTokenStatusText = githubTokenSource === "local"
        ? AppCopy.shell.publishTokenStatusLocal
        : githubTokenSource === "build"
            ? AppCopy.shell.publishTokenStatusBuild
            : AppCopy.shell.publishTokenStatusNone;

    const sidebarNavGroups = [
        {
            key: 'overview',
            label: AppCopy.shell.navGroupOverview,
            items: [
                { key: 'dashboard', href: RootRoutes.AuthorizedRoutes.Root(), icon: HouseIcon, label: AppCopy.shell.navDashboard },
                { key: 'analytics', href: RootRoutes.AuthorizedRoutes.Analytics(), icon: MonitorIcon, label: AppCopy.shell.navAnalytics },
            ],
        },
        {
            key: 'planning',
            label: AppCopy.shell.navGroupPlanning,
            items: [
                { key: 'dishSuggester', href: RootRoutes.AuthorizedRoutes.DishSuggester(), icon: SuggesterIcon, label: AppCopy.shell.navDishSuggester },
                { key: 'meals', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.List(), icon: DietPlanIcon, label: AppCopy.shell.navMeals },
                { key: 'dishFeedback', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.FeedbackHistory(), icon: ChatIcon, label: AppCopy.shell.navDishFeedback },
                { key: 'cookingHistory', href: RootRoutes.AuthorizedRoutes.CookingHistory(), icon: CookingHistoryIcon, label: AppCopy.shell.navCookingHistory },
                { key: 'leftovers', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.Leftovers(), icon: LeftoverIcon, label: AppCopy.shell.navLeftovers },
                { key: 'prepTasks', href: RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.PrepTasks(), icon: PrepTaskIcon, label: AppCopy.shell.navPrepTasks },
                { key: 'shoppingList', href: RootRoutes.AuthorizedRoutes.ShoppingListRoutes.List(), icon: ShoppingListIcon, label: AppCopy.shell.navShoppingList },
                { key: 'expensePlanner', href: RootRoutes.AuthorizedRoutes.ExpensePlanner(), icon: BudgetIcon, label: AppCopy.shell.navExpensePlanner },
            ],
        },
        {
            key: 'library',
            label: AppCopy.shell.navGroupLibrary,
            items: [
                { key: 'dishes', href: RootRoutes.AuthorizedRoutes.DishesRoutes.List(), icon: DishesIcon, label: AppCopy.shell.navDishes },
                { key: 'ingredients', href: RootRoutes.AuthorizedRoutes.IngredientRoutes.List(), icon: IngredientIcon, label: AppCopy.shell.navIngredients },
                { key: 'templates', href: RootRoutes.AuthorizedRoutes.Templates(), icon: LayoutIcon, label: AppCopy.shell.navTemplates },
            ],
        },
        {
            key: 'household',
            label: AppCopy.shell.navGroupHousehold,
            items: [
                { key: 'household', href: RootRoutes.AuthorizedRoutes.HouseholdProfiles(), icon: FamilyIcon, label: AppCopy.shell.navHousehold },
                { key: 'nutritionGoals', href: RootRoutes.AuthorizedRoutes.NutritionGoals(), icon: NutritionPlanIcon, label: AppCopy.shell.navNutritionGoals },
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
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px" }}>{AppCopy.shell.drawerTagline}</Typography.Text>
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
                    <Divider orientation="left" style={{ fontSize: 12, color: "#888", marginTop: 16, marginBottom: 12 }}>{AppCopy.shell.dataSectionTitle}</Divider>
                    <Flex vertical gap={8}>
                        <Button
                            icon={<DatabaseOutlined />}
                            block
                            onClick={toggleBackupCenter.show}
                            style={{ minHeight: 44 }}
                        >
                            {AppCopy.shell.dataBackupButton}
                        </Button>
                        <Button
                            icon={<MedicineBoxOutlined />}
                            block
                            onClick={() => onNavigate(RootRoutes.AuthorizedRoutes.SyncBackupHealth())}
                            style={{ minHeight: 44 }}
                        >
                            {AppCopy.shell.dataHealthButton}
                        </Button>
                        <Typography.Text type="secondary" style={{ fontSize: 11, paddingLeft: 2 }}>
                            {AppCopy.shell.dataSectionHint}
                        </Typography.Text>
                    </Flex>

                    {/* ── Help ── */}
                    <Divider orientation="left" style={{ fontSize: 12, color: "#888", marginTop: 20, marginBottom: 12 }}>{AppCopy.shell.helpSectionTitle}</Divider>
                    <Button
                        icon={<QuestionCircleOutlined />}
                        block
                        onClick={() => onNavigate(RootRoutes.AuthorizedRoutes.UserGuide())}
                        style={{ minHeight: 44 }}
                    >
                        {AppCopy.shell.helpGuideButton}
                    </Button>

                    {/* ── Account ── */}
                    <Divider orientation="left" style={{ fontSize: 12, color: "#888", marginTop: 20, marginBottom: 12 }}>{AppCopy.shell.accountSectionTitle}</Divider>
                    <Flex vertical gap={4}>
                        {isAdmin ? (
                            <>
                                <Flex align="center" justify="space-between" style={{ padding: "4px 0" }}>
                                    <Flex align="center" gap={6}>
                                        <LockOutlined style={{ color: "#52c41a" }} />
                                        <Typography.Text style={{ fontSize: 13, color: "#52c41a", fontWeight: 500 }}>{AppCopy.shell.adminModeActive}</Typography.Text>
                                    </Flex>
                                    <Button type="text" danger onClick={onLock} style={{ minHeight: 44 }}>{AppCopy.shell.lockButton}</Button>
                                </Flex>
                                <Typography.Text type="secondary" style={{ fontSize: 11, paddingLeft: 2 }}>
                                    {AppCopy.shell.adminModeHint}
                                </Typography.Text>
                            </>
                        ) : (
                            <>
                                <Button type="text" icon={<UnlockOutlined />} block onClick={() => setPinModalOpen(true)} style={{ justifyContent: "flex-start", minHeight: 44 }}>
                                    {AppCopy.shell.adminLoginButton}
                                </Button>
                                <Typography.Text type="secondary" style={{ fontSize: 11, paddingLeft: 2 }}>
                                    {AppCopy.shell.adminLoginHint}
                                </Typography.Text>
                            </>
                        )}
                    </Flex>

                    </React.Fragment>}

                </Box>
            </FastDrawerShell>
            <Sheet
                title={AppCopy.shell.pinTitle}
                open={pinModalOpen}
                onClose={() => { setPinModalOpen(false); setPin(""); setPinError(""); }}
                data-testid="sidebar-pin-sheet"
            >
                <Flex vertical gap={12} style={{ padding: 16 }}>
                    <AntInput.Password
                        placeholder={AppCopy.shell.pinPlaceholder}
                        value={pin}
                        onChange={e => { setPin(e.target.value); setPinError(""); }}
                        onPressEnter={onUnlock}
                    />
                    {pinError && <Typography.Text type="danger">{pinError}</Typography.Text>}
                    <Button type="primary" size="large" onClick={onUnlock} style={{ width: "100%", borderRadius: 12 }}>
                        {AppCopy.shell.pinConfirm}
                    </Button>
                </Flex>
            </Sheet>
            <Sheet
                title={<Space><DatabaseOutlined style={{ color: "#7436dc" }} />{AppCopy.shell.backupTitle}</Space>}
                open={toggleBackupCenter.value}
                onClose={toggleBackupCenter.hide}
                data-testid="sidebar-backup-sheet"
            >
                <DeferredModalContent active={toggleBackupCenter.value} minHeight={280}>
                    {toggleBackupCenter.value ? <Flex vertical gap={12} style={{ padding: 16 }}>
                        <Box style={{ border: "1px solid rgba(116,54,220,0.12)", borderRadius: 8, padding: 10, background: "#fbf9ff" }}>
                            <Stack justify="space-between" align="flex-start" gap={8}>
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: "block", color: "#2f2545", fontSize: 15, lineHeight: "20px" }}>{AppCopy.shell.backupSharedTitle}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px" }}>
                                        {AppCopy.shell.backupSharedDesc}
                                    </Typography.Text>
                                </div>
                                <ActionButton tone="primary" icon={<CloudDownloadOutlined />} loading={isSyncChecking} onClick={onImportCloud}>
                                    {AppCopy.shell.backupSyncNow}
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
                                        <Typography.Text strong style={{ display: "block", color: "#2f2545", fontSize: 15, lineHeight: "20px" }}>{AppCopy.shell.inventoryConfigTitle}</Typography.Text>
                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px" }}>
                                            {AppCopy.shell.inventoryConfigDesc}
                                        </Typography.Text>
                                    </div>
                                </Flex>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                                    <Box style={{ border: "1px solid #f0f0f0", borderRadius: 0, padding: 9, background: "#fbf9ff" }}>
                                        <Typography.Text strong style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{AppCopy.shell.inventoryLowThreshold}</Typography.Text>
                                        <NumberStepper
                                            min={0}
                                            step={0.5}
                                            value={inventoryConfigDraft.lowStockAmount}
                                            onChange={value => updateInventoryConfigNumber("lowStockAmount", value)}
                                            style={{ width: "100%" }}
                                        />
                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px", marginTop: 5 }}>
                                            {AppCopy.shell.inventoryLowThresholdHint}
                                        </Typography.Text>
                                    </Box>
                                    <Box style={{ border: "1px solid #f0f0f0", borderRadius: 0, padding: 9, background: "#fbf9ff" }}>
                                        <Typography.Text strong style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{AppCopy.shell.inventoryExpirySoon}</Typography.Text>
                                        <NumberStepper
                                            min={0}
                                            step={1}
                                            value={inventoryConfigDraft.urgentExpiryDays}
                                            onChange={value => updateInventoryConfigNumber("urgentExpiryDays", value)}
                                            style={{ width: "100%" }}
                                        />
                                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "15px", marginTop: 5 }}>
                                            {AppCopy.shell.inventoryExpirySoonHint}
                                        </Typography.Text>
                                    </Box>
                                </div>

                                <Flex vertical gap={8}>
                                    <Typography.Text strong style={{ fontSize: 13, color: "#2f2545" }}>{AppCopy.shell.inventoryExpiryDefaults}</Typography.Text>
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
                                    <ActionButton onClick={resetInventoryConfigDraft}>{AppCopy.shell.inventoryUseDefaults}</ActionButton>
                                    <ActionButton tone="primary" onClick={saveInventoryConfig}>{AppCopy.shell.inventorySaveConfig}</ActionButton>
                                </Flex>
                            </Flex>
                        </Box>}

                        {isAdmin && <Box style={{ border: "1px solid rgba(82,196,26,0.18)", borderRadius: 8, padding: 10, background: "#fcfff8" }}>
                            <Flex vertical gap={8}>
                                <Typography.Text strong style={{ display: "block", color: "#245822", fontSize: 15, lineHeight: "20px" }}>{AppCopy.shell.publishAdminTitle}</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: "17px" }}>
                                    {AppCopy.shell.publishAdminDesc}
                                </Typography.Text>
                                <AntInput.Password
                                    autoComplete="off"
                                    placeholder={AppCopy.shell.publishTokenPlaceholder}
                                    value={publishTokenInput}
                                    onChange={e => setPublishTokenInput(e.target.value)}
                                />
                                <Flex gap={8} wrap="wrap">
                                    <ActionButton disabled={publishTokenSaved} onClick={onSavePublishToken}>
                                        {AppCopy.shell.publishSaveToken}
                                    </ActionButton>
                                    <ActionButton loading={isTestingGithubToken} disabled={!publishTokenInput.trim() && !hasGithubToken} onClick={onTestPublishToken}>
                                        {AppCopy.shell.publishTestToken}
                                    </ActionButton>
                                    <ActionButton tone="danger" disabled={!githubToken} onClick={onClearPublishToken}>
                                        {AppCopy.shell.publishClearToken}
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
                                    {AppCopy.shell.publishButton}
                                </ActionButton>
                                {lastPublishAt && <Typography.Text type="secondary" style={{ fontSize: 11, color: "#52c41a" }}>
                                    {AppCopy.shell.publishLastAt({ when: new Date(lastPublishAt).toLocaleString("vi-VN") })}
                                </Typography.Text>}
                            </Flex>
                        </Box>}

                        <Box style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 10, background: "#fff" }}>
                            <Stack justify="space-between" align="flex-start" gap={8} style={{ marginBottom: 6 }}>
                                <div style={{ minWidth: 0 }}>
                                    <Typography.Text strong style={{ display: "block", color: "#2f2545", fontSize: 15, lineHeight: "20px" }}>{AppCopy.shell.personalBackupTitle}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, lineHeight: "17px" }}>
                                        {AppCopy.shell.personalBackupDesc}
                                    </Typography.Text>
                                </div>
                                <ActionButton icon={<SyncOutlined />} onClick={() => { toggleBackupCenter.hide(); onNavigate(RootRoutes.AuthorizedRoutes.SyncBackupHealth()); }}>
                                    {AppCopy.shell.personalBackupViewHealth}
                                </ActionButton>
                            </Stack>
                            <GistBackupWidget />
                        </Box>
                    </Flex> : null}
                </DeferredModalContent>
            </Sheet>
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
