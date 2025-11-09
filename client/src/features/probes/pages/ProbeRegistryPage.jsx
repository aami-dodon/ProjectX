import { useState } from "react";
import { toast } from "sonner";

import { ProbeDetailsPanel } from "@/features/probes/components/ProbeDetailsPanel";
import { ProbeList } from "@/features/probes/components/ProbeList";
import { useProbeRegistry } from "@/features/probes/hooks/useProbeRegistry";

export function ProbeRegistryPage() {
  const { probes, isLoading, filters, setFilters, registerProbe, refresh } = useProbeRegistry();
  const [selectedProbe, setSelectedProbe] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSelect = (probe) => {
    setSelectedProbe(probe);
  };

  const handleRegister = async (payload) => {
    setIsRegistering(true);
    try {
      const record = await registerProbe(payload);
      toast.success(`Registered ${record?.name ?? "probe"}`);
      refresh();
    } catch (error) {
      toast.error(error?.message ?? "Unable to register probe");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ProbeList
        probes={probes}
        selectedProbeId={selectedProbe?.id}
        onSelect={handleSelect}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
      />
      <ProbeDetailsPanel probe={selectedProbe} onRegister={handleRegister} isRegistering={isRegistering} />
    </div>
  );
}
