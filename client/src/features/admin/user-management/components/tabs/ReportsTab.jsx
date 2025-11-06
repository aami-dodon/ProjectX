import * as React from "react"

import { TabsContent } from "@/shared/components/ui/tabs"

export function ReportsTab() {
  return (
    <TabsContent value="reports" className="mt-0 flex flex-col">
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
        Reports and exports will be available in a future update.
      </div>
    </TabsContent>
  )
}
