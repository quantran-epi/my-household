import { DateHelpers } from "@common/Helpers/DateHelper";
import { DishServingHelper } from "@common/Helpers/DishServingHelper";
import { Divider } from "@components/Layout/Divider";
import { Box } from "@components/Layout/Box";
import { Stack } from "@components/Layout/Stack";
import { List } from "@components/List";
import { Space } from "@components/Layout/Space";
import { Typography } from "@components/Typography";
import { useToggle } from "@hooks";
import { DishesReadonlyDetailModal } from "@modules/Dishes/Screens/DishesManageIngredient/DishReadonlyDetail.widget";
import { ScheduledMealEstimateSummary } from "@modules/ScheduledMeal/Screens/ScheduledMealEstimateSummary.widget";
import { Dishes } from "@store/Models/Dishes";
import { selectDishesById, selectScheduledMealsById } from "@store/Selectors";
import React, { FunctionComponent } from "react";
import { useSelector } from "react-redux";

type ShoppingListMealDetailWidgetProps = {
    mealId: string;
}

export const ShoppingListMealDetailWidget: FunctionComponent<ShoppingListMealDetailWidgetProps> = ({ mealId }) => {
    const dishesById = useSelector(selectDishesById);
    const scheduledMealsById = useSelector(selectScheduledMealsById);
    const meal = scheduledMealsById.get(mealId);

    const _getDishesById = (id: string) => {
        return dishesById.get(id);
    }

    if (!meal) return <Typography.Text type="secondary">Không tìm thấy thực đơn.</Typography.Text>;

    const selectedDishIds = Object.values(meal.meals).flat();

    return <React.Fragment>
        <Divider orientation="left">Thông tin chung</Divider>
        <Stack gap={0} direction="column" align="flex-start">
            <Typography.Text><Typography.Text strong>Tên gợi nhớ: </Typography.Text> {meal.name}</Typography.Text>
            <Typography.Text><Typography.Text strong>Ngày thực hiện: </Typography.Text> {DateHelpers.formatWithCapitalizedWeekday(meal.plannedDate, "ddd, DD/MM/YYYY")}</Typography.Text>
        </Stack>

        <Divider orientation="left">Chi phí và tồn kho</Divider>
        <ScheduledMealEstimateSummary dishIds={selectedDishIds} dishServings={meal.dishServings} title="Ước tính thực đơn" maxRows={8} />

        <Divider orientation="left">Bữa sáng</Divider>
        <List
            dataSource={meal.meals.breakfast}
            renderItem={item => <ShoppingListMealDishesItem dish={_getDishesById(item)} targetServings={meal.dishServings?.[item]} />}
        />
        <Divider orientation="left">Bữa trưa</Divider>
        <List
            dataSource={meal.meals.lunch}
            renderItem={item => <ShoppingListMealDishesItem dish={_getDishesById(item)} targetServings={meal.dishServings?.[item]} />}
        />
        <Divider orientation="left">Bữa tối</Divider>
        <List
            dataSource={meal.meals.dinner}
            renderItem={item => <ShoppingListMealDishesItem dish={_getDishesById(item)} targetServings={meal.dishServings?.[item]} />}
        />
    </React.Fragment>
}

type ShoppingListMealDishesItemProps = {
    dish?: Dishes;
    targetServings?: number;
}

export const ShoppingListMealDishesItem: React.FunctionComponent<ShoppingListMealDishesItemProps> = (props) => {
    const toggleDishesDetail = useToggle();

    if (!props.dish) return null;
    const targetServings = DishServingHelper.getTargetServings(props.dish, props.targetServings);
    const _openDishDetail = () => toggleDishesDetail.show();
    const _onDishKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            _openDishDetail();
        }
    };

    return <React.Fragment>
        <List.Item
            role="button"
            tabIndex={0}
            onClick={_openDishDetail}
            onKeyDown={_onDishKeyDown}
            style={{ padding: "8px 0", cursor: "pointer" }}
        >
            <Stack justify="space-between" align="center" gap={8} fullwidth>
                <Typography.Paragraph style={{ marginBottom: 0, color: "#0958d9" }} ellipsis={{ rows: 2 }}>{props.dish.name}</Typography.Paragraph>
                <Box style={{ flexShrink: 0 }}>
                    <Space size={4}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{targetServings}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>phần</Typography.Text>
                    </Space>
                </Box>
            </Stack>
        </List.Item>
        <DishesReadonlyDetailModal
            dish={props.dish}
            targetServings={targetServings}
            open={toggleDishesDetail.value}
            onClose={toggleDishesDetail.hide}
        />
    </React.Fragment>

}
