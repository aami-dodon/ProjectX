import { IconAdjustmentsHorizontal, IconDownload, IconLink, IconPencil, IconShieldCheck, IconUpload } from "@tabler/icons-react";

import { cn } from "@/shared/lib/utils";

const ACTION_META = {
  UPLOAD_REQUESTED: { label: "Upload requested", icon: IconUpload, color: "text-primary" },
  UPLOAD_CONFIRMED: { label: "Upload confirmed", icon: IconShieldCheck, color: "text-emerald-500" },
  DOWNLOAD_ISSUED: { label: "Download issued", icon: IconDownload, color: "text-blue-500" },
  METADATA_UPDATED: { label: "Metadata updated", icon: IconPencil, color: "text-amber-500" },
  LINK_ATTACHED: { label: "Link added", icon: IconLink, color: "text-sky-500" },
  LINK_REMOVED: { label: "Link removed", icon: IconLink, color: "text-rose-500" },
  RETENTION_UPDATED: { label: "Retention updated", icon: IconAdjustmentsHorizontal, color: "text-indigo-500" },
};

export function EvidenceTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No events recorded yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span className="mt-1 rounded-full bg-muted p-2">
            <TimelineIcon action={event.action} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">{ACTION_META[event.action]?.label ?? event.action}</p>
            <p className="text-xs text-muted-foreground">
              {event.createdAt ? new Date(event.createdAt).toLocaleString() : "—"}
              {event.actorId ? ` · Actor: ${event.actorId}` : ""}
            </p>
            {event.metadata && (
              <pre className="mt-1 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function TimelineIcon({ action }) {
  const meta = ACTION_META[action] ?? { icon: IconAdjustmentsHorizontal, color: "text-muted-foreground" };
  const Icon = meta.icon;
  return <Icon className={cn("h-4 w-4", meta.color)} />;
}
