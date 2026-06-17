import { SearchOutlined } from "@ant-design/icons";
import { AppCopy } from "@common/Copy";
import { Button } from "@components/Button";
import { Content } from "@components/Layout/Content";
import { Header } from "@components/Layout/Header";
import { Stack } from "@components/Layout/Stack";
import { Tooltip } from "@components/Tootip";
import { Typography } from "@components/Typography";
import { useToggle, useOnlineStatus } from "@hooks";
import { GlobalSearchScreen } from "@modules/Home/Screens/GlobalSearch.screen";
import { isUserGuideWelcomeComplete } from "@modules/Home/Screens/UserGuideOnboardingStorage";
import { selectCurrentFeatureName } from "@store/Selectors";
import { Layout } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShellNavigationProvider, useAppShellNavigationController } from "./AppShellNavigationContext";
import { RootRoutes } from "./RootRoutes";
import { BottomTabNavigator } from "./Shell/BottomTabNavigator";
import { CookingPill } from "./Shell/CookingPill";
import { PageActionsMenu } from "./Shell/PageActionsMenu";
import { SidebarDrawer } from "./Shell/SidebarDrawer";
import { headerActionButtonStyle } from "./Shell/shellStyles";

const layoutStyles: React.CSSProperties = {
    height: "100%"
}

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
                            aria-label={AppCopy.shell.searchAriaLabel}
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
                        <span>{AppCopy.shell.offlineBanner}</span>
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
