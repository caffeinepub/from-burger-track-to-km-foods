import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import SalesExpenses from './pages/SalesExpenses';
import StaffManagement from './pages/StaffManagement';

const rootRoute = createRootRoute({
  component: () => (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Toaster richColors position="top-right" />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attendance',
  component: Attendance,
});

const salesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales',
  component: SalesExpenses,
});

const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/staff',
  component: StaffManagement,
});

const routeTree = rootRoute.addChildren([indexRoute, attendanceRoute, salesRoute, staffRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
