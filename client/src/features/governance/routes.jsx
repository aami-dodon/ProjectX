import { RequirePermission } from "@/shared/components/guards/RequirePermission";

import { CheckCatalogPage } from "@/features/governance/checks/pages/CheckCatalogPage";
import { ReviewQueuePage } from "@/features/governance/checks/pages/ReviewQueuePage";
import { ResultExplorerPage } from "@/features/governance/checks/pages/ResultExplorerPage";

const ALLOWED_ROLES = ["admin", "compliance officer"];

const guard = (resource, action, element) => (
  <RequirePermission resource={resource} action={action} allowRoles={ALLOWED_ROLES}>
    {element}
  </RequirePermission>
);

export const governanceRoutes = [
  {
    path: "/governance/checks",
    element: guard("governance:checks", "read", <CheckCatalogPage />),
  },
  {
    path: "/governance/results",
    element: guard("governance:results", "read", <ResultExplorerPage />),
  },
  {
    path: "/governance/review-queue",
    element: guard("governance:review-queue", "read", <ReviewQueuePage />),
  },
  {
    path: "/governance/checks/:checkId/results",
    element: guard("governance:results", "read", <ResultExplorerPage />),
  },
];
