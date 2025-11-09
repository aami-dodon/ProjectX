import { RequirePermission } from "@/shared/components/guards/RequirePermission";

import { FrameworkCatalogPage } from "@/features/frameworks/pages/framework-catalog-page";
import { FrameworkDetailPage } from "@/features/frameworks/pages/framework-detail-page";
import { MappingMatrixPage } from "@/features/frameworks/pages/mapping-matrix-page";
import { VersionHistoryPage } from "@/features/frameworks/pages/version-history-page";

const ALLOWED_ROLES = ["admin", "compliance officer"];

const guard = (resource, action, element) => (
  <RequirePermission resource={resource} action={action} allowRoles={ALLOWED_ROLES}>
    {element}
  </RequirePermission>
);

export const frameworkRoutes = [
  {
    path: "/frameworks",
    element: guard("frameworks:catalog", "read", <FrameworkCatalogPage />),
  },
  {
    path: "/frameworks/:frameworkId",
    element: guard("frameworks:catalog", "read", <FrameworkDetailPage />),
  },
  {
    path: "/frameworks/:frameworkId/mappings",
    element: guard("frameworks:mappings", "read", <MappingMatrixPage />),
  },
  {
    path: "/frameworks/:frameworkId/versions",
    element: guard("frameworks:versions", "read", <VersionHistoryPage />),
  },
];
