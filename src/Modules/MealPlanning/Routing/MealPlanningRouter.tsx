import { Container } from '@components/Layout/Container';
import { Outlet } from 'react-router-dom';

export const MealPlanningRouter = () => {
    return <Container>
        <Outlet />
    </Container>
}
