import { DesignSystemShowcase } from "../components/DesignSystemShowcase";

export function DesignSystemPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-8 px-4 py-6 lg:px-6">
        <DesignSystemShowcase />
      </div>
    </div>
  );
}

export default DesignSystemPage;
