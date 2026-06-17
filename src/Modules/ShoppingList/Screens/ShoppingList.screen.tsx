import { CalendarOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileTextOutlined, LoadingOutlined, MonitorOutlined, MoreOutlined, OrderedListOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { ActionButton, Button } from "@components/Button";
import { Dropdown } from "@components/Dropdown";
import { FastModalShell } from "@components/FastOverlay";
import { Sheet } from "@components/Sheet";
import { DatePicker } from "@components/Form/DatePicker";
import { Input } from "@components/Form/Input";
import { Option, Select } from "@components/Form/Select";
import { Image } from "@components/Image";
import { Box } from "@components/Layout/Box";
import { scrollVirtualListToTop, VirtualListRowFrame, VirtualListScrollTopButton } from "@components/List";
import { Space } from "@components/Layout/Space";
import { Stack } from "@components/Layout/Stack";
import { DeferredModalContent, Modal } from "@components/Modal";
import { useMessage } from "@components/Message";
import { Tooltip } from "@components/Tootip";
import { Typography } from "@components/Typography";
import { AppCopy } from "@common/Copy";
import { usePagedVirtualItems, useScreenTitle, useToggle } from "@hooks";
import { useAppShellNavigation } from "@routing/AppShellNavigationContext";
import { usePageActions } from "@routing/PageActionsContext";
import { Dishes } from "@store/Models/Dishes";
import { Ingredient } from "@store/Models/Ingredient";
import { ScheduledMeal } from "@store/Models/ScheduledMeal";
import { ShoppingList } from "@store/Models/ShoppingList";
import { rememberShoppingListName, ShoppingListTemplate } from "@store/Reducers/AppContextReducer";
import { addShoppingList, generateIngredient, removeShoppingList } from "@store/Reducers/ShoppingListReducer";
import { selectDishes, selectIngredients, selectInventory, selectInventoryHealthConfig, selectScheduledMeals, selectShoppingLists, selectShoppingListTemplates } from "@store/Selectors";
import { nanoid } from "@reduxjs/toolkit";
import { debounce, orderBy } from "lodash";
import dayjs, { Dayjs } from "dayjs";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { List as VirtualList, useDynamicRowHeight, type ListImperativeAPI, type RowComponentProps } from "react-window";
import ShoppinglistIcon from "../../../../assets/icons/shoppingList.png";
import { ShoppingListAddWidget } from "./ShoppingListAdd.widget";
import { ShoppingListExportWidget } from "./ShoppingListExport.widget";
import { ShoppingListAddMoreDishesWidget } from "./ShoppingListAddMoreDishes.widget";
import { ShoppingListCalendarWidget } from "./ShoppingListCalendar.widget";
import { ShoppingListDetailWidget } from "./ShoppingListDetail.widget";
import { ShoppingListEditWidget } from "./ShoppingListEdit.widget";
import { DateHelpers } from "@common/Helpers/DateHelper";
import { RootRoutes } from "@routing/RootRoutes";
import { normalizeDishServings } from "./DishServingSelector.widget";

type ShoppingListStatusFilter = "all" | "buying" | "overdue" | "checklist_done" | "completed" | "empty_checklist";

const SHOPPING_LIST_STATUS_FILTERS: { value: ShoppingListStatusFilter; label: string }[] = [
    { value: "all", label: AppCopy.shoppingList.statusAll },
    { value: "buying", label: AppCopy.shoppingList.statusBuying },
    { value: "overdue", label: AppCopy.shoppingList.statusOverdue },
    { value: "checklist_done", label: AppCopy.shoppingList.statusChecklistDone },
    { value: "completed", label: AppCopy.shoppingList.statusCompleted },
    { value: "empty_checklist", label: AppCopy.shoppingList.statusEmptyChecklist },
];

const SHOPPING_LIST_ROW_HEIGHT = 186;
const SHOPPING_LIST_LOAD_MORE_THRESHOLD = 8;

const filterRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    padding: "6px 0 2px",
    scrollbarWidth: "none",
};

const topToolCardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #f0f0f0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const searchControlRowStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
};

const searchInputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
};

const filterChipStyle = (active: boolean): React.CSSProperties => ({
    border: active ? "1px solid #1677ff" : "1px solid #d9d9d9",
    background: active ? "#e6f4ff" : "#fff",
    color: active ? "#0958d9" : "#595959",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: 12,
    lineHeight: "18px",
    whiteSpace: "nowrap",
    cursor: "pointer",
});

const isShoppingListOverdue = (item: ShoppingList): boolean => {
    return Boolean(item.plannedDate) && !item.completedAt && DateHelpers.calculateDaysBetween(new Date(), item.plannedDate) < 0;
};

const isShoppingListChecklistDone = (item: ShoppingList): boolean => {
    return item.ingredients.length > 0 && item.ingredients.every(ingredient => ingredient.isDone);
};

const shoppingListMatchesSearch = (item: ShoppingList, normalizedSearch: string): boolean => {
    return item.name.trim().toLowerCase().includes(normalizedSearch)
        || moment(item.createdDate).format("DD/MM/YYYY hh:mm:ss A").includes(normalizedSearch);
}

const shoppingListMatchesStatus = (item: ShoppingList, status: ShoppingListStatusFilter): boolean => {
    const checklistDone = isShoppingListChecklistDone(item);
    const isReadonly = Boolean(item.completedAt);
    return status === "all"
        || (status === "buying" && !isReadonly && item.ingredients.length > 0 && !checklistDone)
        || (status === "overdue" && isShoppingListOverdue(item))
        || (status === "checklist_done" && !isReadonly && checklistDone)
        || (status === "completed" && isReadonly)
        || (status === "empty_checklist" && !isReadonly && item.ingredients.length === 0);
}

type ShoppingListRowProps = {
    items: ShoppingList[];
    allDishes: Dishes[];
    allScheduledMeals: ScheduledMeal[];
    allIngredients: Ingredient[];
    onDelete: (item: ShoppingList) => void;
};

const ShoppingListRow = ({ index, style, items, allDishes, allScheduledMeals, allIngredients, onDelete }: RowComponentProps<ShoppingListRowProps>) => {
    if (!items[index]) return null;
    return <VirtualListRowFrame style={style} layout="dynamic">
        <ShoppingListItem item={items[index]} allDishes={allDishes} allScheduledMeals={allScheduledMeals} allIngredients={allIngredients} onDelete={onDelete} />
    </VirtualListRowFrame>;
};

export const ShoppingListScreen = () => {
    const shoppingLists = useSelector(selectShoppingLists);
    const dishes = useSelector(selectDishes);
    const scheduledMeals = useSelector(selectScheduledMeals);
    const ingredients = useSelector(selectIngredients);
    const inventory = useSelector(selectInventory);
    const inventoryConfig = useSelector(selectInventoryHealthConfig);
    const shoppingListTemplates = useSelector(selectShoppingListTemplates);
    const toggleCalendarModal = useToggle({ defaultValue: false });
    const toggleAddModal = useToggle({ defaultValue: false });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    useScreenTitle({ value: AppCopy.shoppingList.screenTitle, deps: [] });
    const [searchText, setSearchText] = useState("");
    const [activeStatus, setActiveStatus] = useState<ShoppingListStatusFilter>("all");
    const [templateApplyOpen, setTemplateApplyOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
    const [templateApplyDate, setTemplateApplyDate] = useState<Dayjs>(dayjs().startOf("day"));
    const virtualListStyle = useMemo<React.CSSProperties>(() => ({
        height: "100%",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
    }), []);
    const listRef = useRef<ListImperativeAPI | null>(null);
    const didMountScrollRef = useRef(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const normalizedSearch = searchText.trim().toLowerCase();

    const _onSearchChange = useMemo(() => debounce((event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        React.startTransition(() => setSearchText(nextValue));
    }, 350), []);

    useEffect(() => () => _onSearchChange.cancel(), [_onSearchChange]);

    const _setScrollTopVisible = useCallback((nextVisible: boolean) => {
        setShowScrollTop(current => current === nextVisible ? current : nextVisible);
    }, []);

    const _setActiveStatus = useCallback((nextStatus: ShoppingListStatusFilter) => {
        React.startTransition(() => setActiveStatus(nextStatus));
    }, []);

    const _onListScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
        _setScrollTopVisible(event.currentTarget.scrollTop > 180);
    }, [_setScrollTopVisible]);

    const filterData = useMemo(() => {
        const statusCounts = SHOPPING_LIST_STATUS_FILTERS.reduce((result, item) => {
            result[item.value] = 0;
            return result;
        }, {} as Record<ShoppingListStatusFilter, number>);
        const filtered: ShoppingList[] = [];

        shoppingLists.forEach(shoppingList => {
            if (!shoppingListMatchesSearch(shoppingList, normalizedSearch)) return;
            SHOPPING_LIST_STATUS_FILTERS.forEach(item => {
                if (shoppingListMatchesStatus(shoppingList, item.value)) statusCounts[item.value] += 1;
            });
            if (shoppingListMatchesStatus(shoppingList, activeStatus)) filtered.push(shoppingList);
        });

        return {
            filteredShoppingLists: orderBy(filtered, [(obj) => new Date(obj.createdDate)], ['desc']),
            statusCounts,
        };
    }, [shoppingLists, normalizedSearch, activeStatus]);
    const { filteredShoppingLists, statusCounts } = filterData;
    const pagedShoppingListsResetKey = `${activeStatus}|${normalizedSearch}`;
    const {
        visibleItems: visibleShoppingLists,
        loadedCount: loadedShoppingListCount,
        totalCount: totalShoppingListCount,
        hasMore: hasMoreShoppingLists,
        loadMore: loadMoreShoppingLists,
    } = usePagedVirtualItems({ items: filteredShoppingLists, resetKey: pagedShoppingListsResetKey });
    const rowHeight = useDynamicRowHeight({ defaultRowHeight: SHOPPING_LIST_ROW_HEIGHT, key: pagedShoppingListsResetKey });
    const [selectedDate, setSelectedDate] = useState<Date>();
    const selectedTemplate = useMemo<ShoppingListTemplate | undefined>(() => {
        return shoppingListTemplates.find(template => template.id === selectedTemplateId) ?? shoppingListTemplates[0];
    }, [shoppingListTemplates, selectedTemplateId]);

    const _onAdd = () => {
        toggleAddModal.show();
    }

    const _onDelete = useCallback((item) => {
        dispatch(removeShoppingList([item.id]));
    }, [dispatch]);

    const shoppingListRowProps = useMemo(() => ({
        items: visibleShoppingLists,
        allDishes: dishes,
        allScheduledMeals: scheduledMeals,
        allIngredients: ingredients,
        onDelete: _onDelete,
    }), [visibleShoppingLists, dishes, scheduledMeals, ingredients, _onDelete]);

    const _onShowCalendar = () => {
        toggleCalendarModal.show();
    }

    const _onOpenTemplateApply = () => {
        setSelectedTemplateId(undefined);
        setTemplateApplyDate(dayjs().startOf("day"));
        setTemplateApplyOpen(true);
    }

    usePageActions([
        { key: "template", label: AppCopy.shoppingList.actionCreateFromTemplate, icon: <FileTextOutlined />, onClick: _onOpenTemplateApply },
        { key: "calendar", label: AppCopy.shoppingList.screenTitle, icon: <CalendarOutlined />, onClick: _onShowCalendar },
    ], []);

    const _applyShoppingListTemplate = () => {
        if (!selectedTemplate) return;
        const normalizedServings = normalizeDishServings(selectedTemplate.dishes, dishes, selectedTemplate.dishServings ?? {});
        const shoppingList: ShoppingList = {
            id: `${selectedTemplate.name}${nanoid(10)}`,
            name: `${selectedTemplate.name} - ${templateApplyDate.format("DD/MM")}`,
            dishes: selectedTemplate.dishes,
            dishServings: normalizedServings,
            ingredients: [],
            scheduledMeals: [],
            createdDate: new Date(),
            plannedDate: templateApplyDate.toDate(),
            completedAt: undefined,
            completionImports: undefined,
        };

        dispatch(addShoppingList(shoppingList));
        dispatch(rememberShoppingListName(shoppingList.name));
        dispatch(generateIngredient({
            shoppingListId: shoppingList.id,
            allDishes: dishes,
            allScheduledMeals: scheduledMeals,
            allIngredients: ingredients,
            inventory,
            inventoryConfig,
            alreadyHaveIngredientIds: [],
            autoMarkCoveredByInventory: true,
            dishServings: normalizedServings,
        }));
        setTemplateApplyOpen(false);
        navigate(RootRoutes.AuthorizedRoutes.ShoppingListRoutes.Detail(shoppingList.id));
    }

    const _onAddWithDate = (date: Date) => {
        setSelectedDate(date);
        _onAdd();
    }

    const _scrollToTop = useCallback(() => {
        const scrolled = scrollVirtualListToTop(listRef.current);
        if (scrolled) setShowScrollTop(false);
        return scrolled;
    }, []);

    const _onRowsRendered = useCallback((visibleRows: { startIndex: number; stopIndex: number }) => {
        _setScrollTopVisible(visibleRows.startIndex > 1);
        if (hasMoreShoppingLists && visibleRows.stopIndex >= Math.max(0, loadedShoppingListCount - SHOPPING_LIST_LOAD_MORE_THRESHOLD)) {
            loadMoreShoppingLists();
        }
    }, [_setScrollTopVisible, hasMoreShoppingLists, loadedShoppingListCount, loadMoreShoppingLists]);

    useEffect(() => {
        if (!didMountScrollRef.current) {
            didMountScrollRef.current = true;
            return;
        }
        _scrollToTop();
    }, [_scrollToTop, activeStatus, searchText]);

    return <React.Fragment>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box style={topToolCardStyle}>
                <Stack.Compact style={searchControlRowStyle}>
                    <Input allowClear data-testid="shopping-list-search-input" placeholder={AppCopy.shoppingList.searchPlaceholder} onChange={_onSearchChange} style={searchInputStyle} />
                    <Button preserveAntdStyle onClick={_onAdd} icon={<PlusOutlined />} />
                </Stack.Compact>
                <div style={filterRowStyle}>
                    {SHOPPING_LIST_STATUS_FILTERS.map(item => (
                        <button key={item.value} type="button" data-testid={`shopping-list-filter-${item.value}`} onClick={() => _setActiveStatus(item.value)} style={filterChipStyle(activeStatus === item.value)}>
                            {item.label} ({statusCounts[item.value] ?? 0})
                        </button>
                    ))}
                </div>
            </Box>
            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                <VirtualList
                    listRef={listRef}
                    rowComponent={ShoppingListRow}
                    rowCount={visibleShoppingLists.length}
                    rowHeight={rowHeight}
                    overscanCount={1}
                    onScroll={_onListScroll}
                    onRowsRendered={_onRowsRendered}
                    rowProps={shoppingListRowProps}
                    style={virtualListStyle}
                    data-testid="shopping-list-virtual-list"
                />
                {hasMoreShoppingLists && <div data-testid="shopping-list-list-page-status" style={{ position: "absolute", left: "50%", bottom: 10, transform: "translateX(-50%)", padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.94)", border: "1px solid #f0f0f0", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", fontSize: 12, color: "#595959", pointerEvents: "none" }}>
                    {AppCopy.shoppingList.loadedCount({ loaded: loadedShoppingListCount, total: totalShoppingListCount })}
                </div>}
                <VirtualListScrollTopButton listRef={listRef} rowCount={visibleShoppingLists.length} visible={showScrollTop} />
            </div>
        </div>
        <Modal open={toggleAddModal.value} title={<Space>
            <Image src={ShoppinglistIcon} preview={false} width={24} style={{ marginBottom: 3 }} />
            {AppCopy.shoppingList.addModalTitle}
        </Space>} destroyOnClose={true} onCancel={toggleAddModal.hide} footer={null}>
            <DeferredModalContent active={toggleAddModal.value}>
                <ShoppingListAddWidget
                    date={selectedDate}
                    onDone={toggleAddModal.hide}
                    onCreated={(shoppingList) => navigate(RootRoutes.AuthorizedRoutes.ShoppingListRoutes.Detail(shoppingList.id))}
                />
            </DeferredModalContent>
        </Modal>

        <Modal style={{ top: 50 }} open={toggleCalendarModal.value} title={<Space>
            <Image src={ShoppinglistIcon} preview={false} width={24} style={{ marginBottom: 3 }} />
            {AppCopy.shoppingList.screenTitle}
        </Space>} destroyOnClose={true} onCancel={toggleCalendarModal.hide} footer={null}>
            <DeferredModalContent active={toggleCalendarModal.value} minHeight={220}>
                <ShoppingListCalendarWidget onAdd={_onAddWithDate} />
            </DeferredModalContent>
        </Modal>

        <Sheet
            open={templateApplyOpen}
            title={<Space><FileTextOutlined />{AppCopy.shoppingList.templateModalTitle}</Space>}
            onClose={() => setTemplateApplyOpen(false)}
            data-testid="shopping-list-template-apply-sheet"
        >
            <Stack direction="column" align="stretch" gap={12} style={{ padding: 16 }}>
                <DeferredModalContent active={templateApplyOpen} minHeight={150}>
                    <Stack direction="column" align="stretch" gap={10}>
                        <div>
                            <Typography.Text strong style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{AppCopy.shoppingList.templateLabel}</Typography.Text>
                            <Select
                                value={selectedTemplate?.id}
                                onChange={setSelectedTemplateId}
                                placeholder={AppCopy.shoppingList.templatePlaceholder}
                                disabled={shoppingListTemplates.length === 0}
                                style={{ width: "100%" }}
                            >
                                {shoppingListTemplates.map(template => <Option key={template.id} value={template.id}>{template.name}</Option>)}
                            </Select>
                            {shoppingListTemplates.length === 0 && <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 6 }}>
                                {AppCopy.shoppingList.templateNoneHint}
                            </Typography.Text>}
                        </div>
                        <div>
                            <Typography.Text strong style={{ display: "block", fontSize: 12, marginBottom: 5 }}>{AppCopy.shoppingList.plannedDateLabel}</Typography.Text>
                            <DatePicker value={templateApplyDate} onChange={value => value && setTemplateApplyDate(value)} format="DD/MM/YYYY" style={{ width: "100%" }} />
                        </div>
                        {selectedTemplate && <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: "17px" }}>
                            {AppCopy.shoppingList.templatePreview({ dishCount: selectedTemplate.dishes.length })}
                        </Typography.Text>}
                    </Stack>
                </DeferredModalContent>
                <Stack direction="column" gap={8} fullwidth>
                    <Button type="primary" size="large" disabled={shoppingListTemplates.length === 0} onClick={_applyShoppingListTemplate} style={{ width: "100%", minHeight: 44 }}>
                        {AppCopy.shoppingList.templateCreateAction}
                    </Button>
                    <Button size="large" onClick={() => setTemplateApplyOpen(false)} style={{ width: "100%", minHeight: 44 }}>
                        {AppCopy.common.cancel}
                    </Button>
                </Stack>
            </Stack>
        </Sheet>
    </React.Fragment>
}

type ShoppingListItemProps = {
    item: ShoppingList;
    allDishes: Dishes[];
    allScheduledMeals: ScheduledMeal[];
    allIngredients: Ingredient[];
    onDelete: (item: ShoppingList) => void;
}

const ShoppingListItemComponent: React.FunctionComponent<ShoppingListItemProps> = (props) => {
    const toggleIngredient = useToggle({ defaultValue: false });
    const toggleAddMoreDishes = useToggle({ defaultValue: false });
    const { navigateWithFeedback } = useAppShellNavigation();
    const dispatch = useDispatch();
    const message = useMessage();
    const toggleEditModal = useToggle({ defaultValue: false });
    const toggleLoading = useToggle();
    const toggleExport = useToggle();
    const toggleDeleteConfirm = useToggle();
    const toggleReloadConfirm = useToggle({ defaultValue: false });
    const isReadonly = Boolean(props.item.completedAt);

    const _onGenerate = () => {
        if (isReadonly) return;
        dispatch(generateIngredient({
            shoppingListId: props.item.id,
            allDishes: props.allDishes,
            allScheduledMeals: props.allScheduledMeals,
            allIngredients: props.allIngredients,
        }));
        message.success(AppCopy.shoppingList.regenerateSuccessToast);
    }

    const _onGenerateAndShow = () => {
        if (isReadonly) {
            _onShow();
            return;
        }
        _onShow();
        const schedule = window.requestAnimationFrame ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 0) as unknown as number);
        schedule(() => {
            schedule(() => {
                React.startTransition(() => _onGenerate());
            });
        });
    }

    const _isAllIngredientDone = () => {
        return props.item.ingredients.length > 0 && props.item.ingredients.every(ingre => ingre.isDone);
    }

    const _onShow = () => {
        toggleLoading.show();
        toggleIngredient.show();
    }

    const _onOpenDetailPage = () => {
        navigateWithFeedback(RootRoutes.AuthorizedRoutes.ShoppingListRoutes.Detail(props.item.id), toggleIngredient.hide);
    }

    const _onAddMoreDishes = () => {
        if (isReadonly) return;
        toggleAddMoreDishes.show();
    }

    const _onMoreActionClick = (e) => {
        if (isReadonly && ["reload", "add_dishes", "edit_shopping_list"].includes(e.key)) return;
        switch (e.key) {
            case "reload": toggleReloadConfirm.show(); break;
            case "add_dishes": _onAddMoreDishes(); break;
            case "edit_shopping_list": toggleEditModal.show(); break;
            case "export": toggleExport.show(); break;
            case "delete": toggleDeleteConfirm.show(); break;
        }
    }

    const _isOverdue = () => {
        return Boolean(props.item.plannedDate) && !isReadonly && DateHelpers.calculateDaysBetween(new Date(), props.item.plannedDate) < 0;
    }

    const doneCount = props.item.ingredients.filter(e => e.isDone).length;
    const totalIngredientCount = props.item.ingredients.length;
    const progressPercent = totalIngredientCount > 0 ? Math.round(doneCount / totalIngredientCount * 100) : 0;
    const hasChecklist = totalIngredientCount > 0;
    const isAllIngredientDone = _isAllIngredientDone();
    const isOverdue = _isOverdue();
    const dishCount = props.item.dishes.length;
    const scheduledMealCount = props.item.scheduledMeals?.length ?? 0;
    const status = isReadonly
        ? { label: AppCopy.shoppingList.statusCompleted, color: "#1677ff", background: "#e6f4ff", border: "#91caff", icon: <CheckCircleOutlined /> }
        : isAllIngredientDone
            ? { label: AppCopy.shoppingList.statusChecklistDone, color: "#389e0d", background: "#f6ffed", border: "#b7eb8f", icon: <CheckCircleOutlined /> }
            : isOverdue
                ? { label: AppCopy.shoppingList.statusOverdue, color: "#cf1322", background: "#fff1f0", border: "#ffa39e", icon: <ExclamationCircleOutlined /> }
                : hasChecklist
                    ? { label: AppCopy.shoppingList.statusBuying, color: "#d46b08", background: "#fff7e6", border: "#ffd591", icon: <OrderedListOutlined /> }
                    : { label: AppCopy.shoppingList.statusNoChecklist, color: "#8c8c8c", background: "#fafafa", border: "#d9d9d9", icon: <OrderedListOutlined /> };
    const plannedLabel = props.item.plannedDate ? DateHelpers.formatWithCapitalizedWeekday(props.item.plannedDate, "ddd, DD/MM/YY") : AppCopy.shoppingList.plannedDateUnset;
    const plannedColor = isOverdue ? "#cf1322" : "#595959";
    const createdLabel = DateHelpers.formatWithCapitalizedWeekday(props.item.createdDate, "ddd, DD/MM/YY hh:mm A");
    const completedLabel = props.item.completedAt ? moment(props.item.completedAt).format("DD/MM/YY") : null;

    return <React.Fragment>
        <div data-testid={`shopping-list-item-${props.item.id}`} style={{ padding: "6px 0 8px", boxSizing: "border-box" }}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "5px minmax(0, 1fr)",
                minHeight: 142,
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                overflow: "hidden",
                boxSizing: "border-box",
            }}>
                <div style={{ background: status.color }} />
                <div style={{ padding: 10, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
                        <div style={{ minWidth: 0 }}>
                            <Tooltip title={props.item.name}>
                                <Typography.Paragraph
                                    style={{ marginBottom: 3, fontWeight: 650, lineHeight: "21px", textDecorationLine: isAllIngredientDone ? "line-through" : undefined }}
                                    type={isAllIngredientDone ? "secondary" : undefined}
                                    ellipsis={{ rows: 2 }}
                                >
                                    {props.item.name}
                                </Typography.Paragraph>
                            </Tooltip>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 999, background: status.background, color: status.color, border: `1px solid ${status.border}`, fontSize: 11, lineHeight: "18px", fontWeight: 650 }}>
                                    {status.icon} {status.label}
                                </span>
                                <span style={{ padding: "1px 7px", borderRadius: 999, background: "#f0f5ff", color: "#1d39c4", fontSize: 11, lineHeight: "18px", fontWeight: 600 }}>{AppCopy.shoppingList.dishCount({ count: dishCount })}</span>
                                <span style={{ padding: "1px 7px", borderRadius: 999, background: "#fafafa", color: "#595959", border: "1px solid #f0f0f0", fontSize: 11, lineHeight: "18px" }}>{AppCopy.shoppingList.scheduledMealCount({ count: scheduledMealCount })}</span>
                                {completedLabel && <span style={{ padding: "1px 7px", borderRadius: 999, background: "#e6f4ff", color: "#0958d9", border: "1px solid #91caff", fontSize: 11, lineHeight: "18px" }}>{AppCopy.shoppingList.completedShortLabel({ when: completedLabel })}</span>}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            {hasChecklist
                                ? <ActionButton tone="primary" onClick={_onShow} icon={toggleLoading.value ? <LoadingOutlined /> : <MonitorOutlined />}>{AppCopy.shoppingList.openAction}</ActionButton>
                                : <ActionButton tone="primary" onClick={_onGenerateAndShow} icon={toggleLoading.value ? <LoadingOutlined /> : <MonitorOutlined />}>{AppCopy.shoppingList.generateAction}</ActionButton>}
                            <Dropdown menu={{
                                items: [
                                    { label: AppCopy.shoppingList.exportAction, key: 'export', icon: <FileTextOutlined /> },
                                    { label: AppCopy.shoppingList.regenerateMenuAction, key: 'reload', icon: <ReloadOutlined />, disabled: isReadonly },
                                    { label: AppCopy.shoppingList.editDishesAction, key: 'add_dishes', icon: <OrderedListOutlined />, disabled: isReadonly },
                                    { label: AppCopy.shoppingList.editListAction, key: 'edit_shopping_list', icon: <EditOutlined />, disabled: isReadonly },
                                    { type: 'divider' },
                                    { label: AppCopy.shoppingList.delete, key: 'delete', icon: <DeleteOutlined />, danger: true },
                                ],
                                onClick: _onMoreActionClick
                            }} placement="bottomRight">
                                <Button type="text" data-testid={`shopping-list-row-menu-${props.item.id}`} icon={<MoreOutlined />} style={{ width: 34, paddingInline: 0 }} />
                            </Dropdown>
                        </div>
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 5 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{AppCopy.shoppingList.checklistLabel}</Typography.Text>
                            <Typography.Text strong style={{ fontSize: 12, color: status.color }}>{AppCopy.shoppingList.ingredientProgress({ done: doneCount, total: totalIngredientCount })}</Typography.Text>
                        </div>
                        <div style={{ height: 7, borderRadius: 999, background: "#f0f0f0", overflow: "hidden" }}>
                            <div style={{ width: `${progressPercent}%`, height: "100%", background: status.color, borderRadius: 999, transition: "width 0.2s ease" }} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "14px" }}>{AppCopy.shoppingList.plannedDateLabel}</Typography.Text>
                            {isOverdue ? <Tooltip title={moment(props.item.plannedDate).startOf("day").from(moment().startOf("day"))}>
                                <Typography.Text strong style={{ display: "block", color: plannedColor, fontSize: 13, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{plannedLabel}</Typography.Text>
                            </Tooltip> : <Typography.Text strong style={{ display: "block", color: plannedColor, fontSize: 13, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{plannedLabel}</Typography.Text>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, lineHeight: "14px" }}>{AppCopy.shoppingList.createdDateLabel}</Typography.Text>
                            <Typography.Text strong style={{ display: "block", fontSize: 13, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{createdLabel}</Typography.Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {toggleIngredient.value && <FastModalShell style={{ top: 50 }} open={toggleIngredient.value} title={<Space>
            <Image src={ShoppinglistIcon} preview={false} width={24} style={{ marginBottom: 3 }} />
            {props.item.name}
        </Space>} onClose={toggleIngredient.hide} footer={<Space>
            <Button onClick={toggleIngredient.hide}>{AppCopy.shoppingList.close}</Button>
            <Button type="primary" icon={<EditOutlined />} onClick={_onOpenDetailPage}>{AppCopy.shoppingList.openDetailPageAction}</Button>
        </Space>} afterOpenChange={toggleLoading.hide}>
            <DeferredModalContent active={toggleIngredient.value} minHeight={220}>
                <Box data-testid="shopping-list-ingredient-modal" style={{ maxHeight: 550, overflowY: "auto" }}>
                    <ShoppingListDetailWidget shoppingList={props.item} />
                </Box>
            </DeferredModalContent>
        </FastModalShell>}
        {toggleAddMoreDishes.value && <Modal style={{ top: 50 }} open={toggleAddMoreDishes.value} title={<Space>
            <Image src={ShoppinglistIcon} preview={false} width={24} style={{ marginBottom: 3 }} />
            {AppCopy.shoppingList.editDishesAction}
        </Space>} destroyOnClose={true} onCancel={toggleAddMoreDishes.hide} footer={null}>
            <DeferredModalContent active={toggleAddMoreDishes.value} minHeight={220}>
                <Box data-testid="shopping-list-add-dishes-modal" style={{ maxHeight: 550, overflowY: "auto" }}>
                    <ShoppingListAddMoreDishesWidget shoppingList={props.item} onDone={() => {
                        toggleAddMoreDishes.hide();
                        toggleReloadConfirm.show();
                    }} />
                </Box>
            </DeferredModalContent>
        </Modal>}
        {toggleEditModal.value && <Modal open={toggleEditModal.value} title={
            <Space>
                <Image src={ShoppinglistIcon} preview={false} width={24} style={{ marginBottom: 3 }} />
                {AppCopy.shoppingList.editListAction}
            </Space>
        } destroyOnClose={true} onCancel={toggleEditModal.hide} footer={null}>
            <DeferredModalContent active={toggleEditModal.value} minHeight={180}>
                <div data-testid="shopping-list-edit-modal">
                    <ShoppingListEditWidget item={props.item} onDone={toggleEditModal.hide} />
                </div>
            </DeferredModalContent>
        </Modal>}
        {toggleExport.value && <ShoppingListExportWidget shoppingList={props.item} allIngredients={props.allIngredients} open={toggleExport.value} onClose={toggleExport.hide} />}
        {toggleReloadConfirm.value && <Sheet
            open={toggleReloadConfirm.value}
            title={<Space><ReloadOutlined />{AppCopy.shoppingList.regenerateMenuAction}</Space>}
            onClose={toggleReloadConfirm.hide}
            data-testid={`shopping-list-reload-confirm-${props.item.id}`}
        >
            <Stack direction="column" gap={12} fullwidth align="stretch" style={{ padding: 16 }}>
                <Typography.Text style={{ fontSize: 14, lineHeight: "20px" }}>
                    {AppCopy.shoppingList.reloadConfirmContent}
                </Typography.Text>
                <Stack direction="column" gap={8} fullwidth>
                    <Button type="primary" size="large" onClick={() => { _onGenerate(); toggleReloadConfirm.hide(); }} style={{ width: "100%", minHeight: 44 }}>
                        {AppCopy.shoppingList.reloadConfirmOk}
                    </Button>
                    <Button size="large" onClick={toggleReloadConfirm.hide} style={{ width: "100%", minHeight: 44 }}>
                        {AppCopy.common.cancel}
                    </Button>
                </Stack>
            </Stack>
        </Sheet>}
        {toggleDeleteConfirm.value && <Sheet
            open={toggleDeleteConfirm.value}
            title={<Space><DeleteOutlined style={{ color: "red" }} />{AppCopy.shoppingList.deleteConfirmTitle}</Space>}
            onClose={toggleDeleteConfirm.hide}
            data-testid={`shopping-list-delete-confirm-${props.item.id}`}
        >
            <Stack direction="column" gap={12} fullwidth align="stretch" style={{ padding: 16 }}>
                <Typography.Text style={{ fontSize: 14, lineHeight: "20px" }}>
                    {AppCopy.shoppingList.deleteConfirmBody({ name: props.item.name })}
                </Typography.Text>
                <Stack direction="column" gap={8} fullwidth>
                    <Button type="primary" danger size="large" onClick={() => { props.onDelete(props.item); toggleDeleteConfirm.hide(); }} style={{ width: "100%", minHeight: 44 }}>
                        {AppCopy.shoppingList.delete}
                    </Button>
                    <Button size="large" onClick={toggleDeleteConfirm.hide} style={{ width: "100%", minHeight: 44 }}>
                        {AppCopy.common.cancel}
                    </Button>
                </Stack>
            </Stack>
        </Sheet>}
    </React.Fragment >
}

export const ShoppingListItem = React.memo(ShoppingListItemComponent);
