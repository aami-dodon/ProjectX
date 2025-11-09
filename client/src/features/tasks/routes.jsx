import { RequirePermission } from "@/shared/components/guards/RequirePermission";

import { TaskBoardPage } from "@/features/tasks/pages/TaskBoardPage";
import { TaskDetailPage } from "@/features/tasks/pages/TaskDetailPage";
import { TaskInboxPage } from "@/features/tasks/pages/TaskInboxPage";

const ALLOWED_ROLES = ["admin", "compliance officer", "operator"];

const guard = (resource, action, element) => (
  <RequirePermission resource={resource} action={action} allowRoles={ALLOWED_ROLES}>
    {element}
  </RequirePermission>
);

export const tasksRoutes = [
  {
    path: "/tasks",
    element: guard("tasks:records", "read", <TaskInboxPage />),
  },
  {
    path: "/tasks/board",
    element: guard("tasks:records", "read", <TaskBoardPage />),
  },
  {
    path: "/tasks/:taskId",
    element: guard("tasks:records", "read", <TaskDetailPage />),
  },
];
