import { EvidenceDetailPage } from "@/features/evidence/pages/EvidenceDetailPage";
import { EvidenceLibraryPage } from "@/features/evidence/pages/EvidenceLibraryPage";
import { EvidenceRetentionPage } from "@/features/evidence/pages/EvidenceRetentionPage";
import { EvidenceUploadPage } from "@/features/evidence/pages/EvidenceUploadPage";

export const evidenceRoutes = [
  {
    path: "/evidence",
    element: <EvidenceLibraryPage />,
  },
  {
    path: "/evidence/upload",
    element: <EvidenceUploadPage />,
  },
  {
    path: "/evidence/retention",
    element: <EvidenceRetentionPage />,
  },
  {
    path: "/evidence/:evidenceId",
    element: <EvidenceDetailPage />,
  },
];
