import type { EventStatus } from "@/lib/types";
import { EVENT_STATUS_LABEL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const TONES: Record<EventStatus, "volt" | "warn" | "win" | "muted" | "neutral" | "loss"> = {
  draft: "neutral",
  open: "volt",
  closed: "warn",
  resolved: "win",
  canceled: "muted",
  disputed: "loss",
};

export interface EventStatusBadgeProps {
  status: EventStatus;
  dot?: boolean;
}

export function EventStatusBadge({ status, dot = true }: EventStatusBadgeProps) {
  return (
    <Badge tone={TONES[status]} dot={dot}>
      {EVENT_STATUS_LABEL[status]}
    </Badge>
  );
}
