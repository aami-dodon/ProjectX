import { ChartAreaInteractive } from "@/features/home/components/ChartAreaInteractive";
import { DataTable } from "@/features/home/components/DataTable";
import { SectionCards } from "@/features/home/components/SectionCards";
import data from "./data.json";

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
