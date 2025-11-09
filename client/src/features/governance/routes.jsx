import { RequirePermission } from "@/shared/components/guards/RequirePermission";

import { CheckCatalogPage } from "@/features/governance/checks/pages/CheckCatalogPage";
import { ReviewQueuePage } from "@/features/governance/checks/pages/ReviewQueuePage";
import { ResultExplorerPage } from "@/features/governance/checks/pages/ResultExplorerPage";
import {
  ControlCatalogPage,
  ControlDetailPage,
  ControlScoreboardPage,
  FrameworkMappingPage,
} from "@/features/governance/controls";

const ALLOWED_ROLES = ["admin", "compliance officer"];

const guard = (resource, action, element) => (
  <RequirePermission resource={resource} action={action} allowRoles={ALLOWED_ROLES}>
    {element}
  </RequirePermission>
);

export const governanceRoutes = [
  {
    path: "/governance/controls",
    element: guard("governance:controls", "read", <ControlCatalogPage />),
  },
  {
    path: "/governance/controls/scoreboard",
    element: guard("governance:controls", "read", <ControlScoreboardPage />),
  },
  {
    path: "/governance/controls/:controlId",
    element: guard("governance:controls", "read", <ControlDetailPage />),
  },
  {
    path: "/governance/controls/:controlId/mappings",
    element: guard("governance:controls:mappings", "update", <FrameworkMappingPage />),
  },
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
