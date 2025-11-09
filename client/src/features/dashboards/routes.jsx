import { RequirePermission } from "@/shared/components/guards/RequirePermission";

import { FrameworkScoresPage } from "@/features/dashboards/pages/FrameworkScoresPage";
import { ControlHealthPage } from "@/features/dashboards/pages/ControlHealthPage";
import { RemediationDashboardPage } from "@/features/dashboards/pages/RemediationDashboardPage";
import { EvidenceCoveragePage } from "@/features/dashboards/pages/EvidenceCoveragePage";

const ALLOWED_ROLES = ["admin", "compliance officer", "auditor", "executive"];

const guard = (element) => (
  <RequirePermission resource="reports:dashboards" action="read" allowRoles={ALLOWED_ROLES}>
    {element}
  </RequirePermission>
);

export const dashboardsRoutes = [
  {
    path: "/dashboards/frameworks",
    element: guard(<FrameworkScoresPage />),
  },
  {
    path: "/dashboards/control-health",
    element: guard(<ControlHealthPage />),
  },
  {
    path: "/dashboards/remediation",
    element: guard(<RemediationDashboardPage />),
  },
  {
    path: "/dashboards/evidence",
    element: guard(<EvidenceCoveragePage />),
  },
];
