import { RouteHelpers } from "@common/Helpers/RouteHelper"

const MealPlanningRoutes = RouteHelpers.CreateRoutes('/meal-planning', (mealPlanningRoot) => ({
    Wizard: () => RouteHelpers.CreateRoute(mealPlanningRoot, ["wizard"])
}))

export default MealPlanningRoutes
