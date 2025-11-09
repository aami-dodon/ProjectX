import { useNavigate } from "react-router-dom";

import { EvidenceUploadWizard } from "@/features/evidence/components/EvidenceUploadWizard";

export function EvidenceUploadPage() {
  const navigate = useNavigate();

  const handleComplete = (record) => {
    if (record?.id) {
      navigate(`/evidence/${record.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <EvidenceUploadWizard onCompleted={handleComplete} />
    </div>
  );
}
