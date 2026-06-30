import { Image } from "@components/Image";
import { Typography } from "@components/Typography";
import { iosTokens, safeAreaInset } from "@theme";
import React from "react";
import { useLocation } from "react-router-dom";
import DietPlanIcon from "../../../assets/icons/diet-plan.png";
import DishesIcon from "../../../assets/icons/noodles.png";
import ShoppingListIcon from "../../../assets/icons/shoppingList.png";
import SuggesterIcon from "../../../assets/icons/cooking.png";
import BudgetIcon from "../../../assets/icons/budget.png";
import { useAppShellNavigation } from "../AppShellNavigationContext";
import { RootRoutes } from "../RootRoutes";

export const BottomTabNavigator = () => {
    const location = useLocation();
    const { navigateWithFeedback, isRouteFeedbackActive, pendingDestination } = useAppShellNavigation();
    const dishesRoute = RootRoutes.AuthorizedRoutes.DishesRoutes.List();
    const mealsRoute = RootRoutes.AuthorizedRoutes.ScheduledMealRoutes.List();
    const shoppingRoute = RootRoutes.AuthorizedRoutes.ShoppingListRoutes.List();
    const budgetRoute = RootRoutes.AuthorizedRoutes.ExpensePlanner();
    const wizardRoute = RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Wizard();
    const pendingRoute = isRouteFeedbackActive ? pendingDestination : null;
    const isRouteActive = (href: string) => location.pathname === href || pendingRoute === href;
    const dishesActive = isRouteActive(dishesRoute);
    const mealsActive = isRouteActive(mealsRoute);
    const shoppingActive = isRouteActive(shoppingRoute);
    const budgetActive = isRouteActive(budgetRoute);
    const wizardActive = isRouteActive(wizardRoute);

    const _containerStyles = (): React.CSSProperties => {
        return {
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            minHeight: iosTokens.layout.bottomNavContainerMinHeight,
            padding: `16px 10px ${safeAreaInset.bottom(iosTokens.spacing.sm)}`,
            boxSizing: "border-box",
            overflow: "visible",
            zIndex: 900,
            touchAction: "manipulation",
            pointerEvents: "none",
        }
    }

    const _dockStyles = (): React.CSSProperties => {
        return {
            position: "relative",
            width: "min(392px, calc(100vw - 24px))",
            height: 64,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0,
            padding: "6px 8px",
            boxSizing: "border-box",
            border: "1px solid rgba(116, 54, 220, 0.14)",
            borderRadius: iosTokens.radius.xxl,
            background: "rgba(255,255,255,0.98)",
            boxShadow: iosTokens.surface.shadowNav,
            pointerEvents: "auto",
            overflow: "visible",
        }
    }

    const _buttonStyles = (active: boolean): React.CSSProperties => {
        return {
            flex: "1 1 0",
            position: "relative",
            zIndex: 1,
            minWidth: 0,
            maxWidth: 62,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            height: iosTokens.touchTarget.comfortable,
            border: 0,
            borderRadius: iosTokens.radius.lg,
            background: active ? iosTokens.color.accentFill : "transparent",
            color: active ? iosTokens.color.text : iosTokens.color.textMuted,
            cursor: "pointer",
            font: "inherit",
            padding: "4px 2px 3px",
            boxSizing: "border-box",
            transition: "color 160ms ease, transform 160ms ease",
        }
    }

    const _suggesterButtonStyles = (): React.CSSProperties => {
        return {
            width: 74,
            height: 82,
            position: "relative",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            border: 0,
            borderRadius: 20,
            background: "transparent",
            color: "#2f2545",
            cursor: "pointer",
            font: "inherit",
            padding: 0,
            boxSizing: "border-box",
            transform: "translateY(-15px)",
            transition: "transform 160ms ease",
        }
    }

    const _sideIconShellStyles = (active: boolean): React.CSSProperties => {
        return {
            width: 26,
            height: 26,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: iosTokens.radius.md,
            background: active ? "rgba(116, 54, 220, 0.12)" : "transparent",
            flexShrink: 0,
        }
    }

    const _centerBumpStyles = (): React.CSSProperties => {
        return {
            position: "absolute",
            zIndex: 1,
            top: -24,
            left: "50%",
            width: 76,
            height: 76,
            borderRadius: "50%",
            transform: "translateX(-50%)",
            background: "#ffffff",
            pointerEvents: "none",
        }
    }

    const _centerIconShellStyles = (active: boolean): React.CSSProperties => {
        return {
            position: "relative",
            zIndex: 2,
            width: 54,
            height: 54,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "5px solid #ffffff",
            background: active
                ? "linear-gradient(135deg, #8f46f7 0%, #5e2bbf 100%)"
                : "linear-gradient(135deg, #9b5cff 0%, #7436dc 100%)",
            boxShadow: active
                ? "0 10px 20px rgba(116, 54, 220, 0.34)"
                : "0 8px 18px rgba(116, 54, 220, 0.28)",
            boxSizing: "border-box",
            flexShrink: 0,
        }
    }

    const _labelStyles = (active: boolean): React.CSSProperties => {
        return {
            display: "block",
            color: active ? iosTokens.color.text : iosTokens.color.textMuted,
            fontWeight: active ? 650 : 500,
            fontSize: 10,
            lineHeight: "13px",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
        }
    }

    const _centerLabelStyles = (): React.CSSProperties => {
        return {
            display: "block",
            color: iosTokens.color.text,
            fontWeight: 650,
            fontSize: 10,
            lineHeight: "13px",
            whiteSpace: "nowrap",
            marginTop: 0,
        }
    }

    const onNavigate = (href: string) => {
        if (location.pathname === href && !isRouteFeedbackActive) return;
        navigateWithFeedback(href);
    }

    return <>
        <div style={_containerStyles()} data-testid="bottom-tab-navigator">
            <div style={_dockStyles()}>
                <div style={_centerBumpStyles()} />
                <button
                    type="button"
                    aria-pressed={dishesActive}
                    aria-label="Món ăn"
                    data-testid="bottom-tab-dishes"
                    style={_buttonStyles(dishesActive)}
                    onClick={() => onNavigate(dishesRoute)}
                >
                    <span style={_sideIconShellStyles(dishesActive)}>
                        <Image src={DishesIcon} preview={false} width={21} alt="" />
                    </span>
                    <Typography.Text style={_labelStyles(dishesActive)}>Món ăn</Typography.Text>
                </button>
                <button
                    type="button"
                    aria-pressed={mealsActive}
                    aria-label="Thực đơn"
                    data-testid="bottom-tab-scheduled-meals"
                    style={_buttonStyles(mealsActive)}
                    onClick={() => onNavigate(mealsRoute)}
                >
                    <span style={_sideIconShellStyles(mealsActive)}>
                        <Image src={DietPlanIcon} preview={false} width={21} alt="" />
                    </span>
                    <Typography.Text style={_labelStyles(mealsActive)}>Thực đơn</Typography.Text>
                </button>
                <button
                    type="button"
                    aria-pressed={wizardActive}
                    aria-label="Nấu gì?"
                    data-testid="bottom-tab-suggester"
                    style={_suggesterButtonStyles()}
                    onClick={() => onNavigate(wizardRoute)}
                >
                    <span style={_centerIconShellStyles(wizardActive)}>
                        <Image src={SuggesterIcon} preview={false} width={27} alt="" />
                    </span>
                    <Typography.Text style={_centerLabelStyles()}>Nấu gì?</Typography.Text>
                </button>
                <button
                    type="button"
                    aria-pressed={shoppingActive}
                    aria-label="Mua sắm"
                    data-testid="bottom-tab-shopping-list"
                    style={_buttonStyles(shoppingActive)}
                    onClick={() => onNavigate(shoppingRoute)}
                >
                    <span style={_sideIconShellStyles(shoppingActive)}>
                        <Image src={ShoppingListIcon} preview={false} width={21} alt="" />
                    </span>
                    <Typography.Text style={_labelStyles(shoppingActive)}>Mua sắm</Typography.Text>
                </button>
                <button
                    type="button"
                    aria-pressed={budgetActive}
                    aria-label="Tính chi phí"
                    data-testid="bottom-tab-expense-planner"
                    style={_buttonStyles(budgetActive)}
                    onClick={() => onNavigate(budgetRoute)}
                >
                    <span style={_sideIconShellStyles(budgetActive)}>
                        <Image src={BudgetIcon} preview={false} width={21} alt="" />
                    </span>
                    <Typography.Text style={_labelStyles(budgetActive)}>Tính phí</Typography.Text>
                </button>
            </div>
        </div>
    </>
}
