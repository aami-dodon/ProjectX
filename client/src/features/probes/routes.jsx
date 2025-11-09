import { RequirePermission } from "@/shared/components/guards/RequirePermission";

import { ProbeDeploymentPage } from "@/features/probes/pages/ProbeDeploymentPage";
import { ProbeHealthDashboard } from "@/features/probes/pages/ProbeHealthDashboard";
import { ProbeRegistryPage } from "@/features/probes/pages/ProbeRegistryPage";
import { ProbeSchedulePage } from "@/features/probes/pages/ProbeSchedulePage";

const guard = (element, props) => (
  <RequirePermission resource="probes:registry" action="read" allowRoles={["admin", "compliance officer", "engineer"]} {...props}>
    {element}
  </RequirePermission>
);

export const probeRoutes = [
  {
    path: "/probes",
    element: guard(<ProbeRegistryPage />),
  },
  {
    path: "/probes/:probeId/deployments",
    element: (
      <RequirePermission resource="probes:deployments" action="read" allowRoles={["admin", "compliance officer", "engineer"]}>
        <ProbeDeploymentPage />
      </RequirePermission>
    ),
  },
  {
    path: "/probes/:probeId/schedules",
    element: (
      <RequirePermission resource="probes:schedules" action="read" allowRoles={["admin", "compliance officer"]}>
        <ProbeSchedulePage />
      </RequirePermission>
    ),
  },
  {
    path: "/probes/:probeId/health",
    element: (
      <RequirePermission resource="probes:metrics" action="read" allowRoles={["admin", "compliance officer", "engineer"]}>
        <ProbeHealthDashboard />
      </RequirePermission>
    ),
  },
];
