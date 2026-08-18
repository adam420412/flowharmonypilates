import { useEffect, useState } from "react";

/** Odliczanie do terminu opłacenia rezerwacji (mm:ss). */
export function PaymentCountdown({
  dueAt,
  onExpire,
  className,
  compact,
}: {
  dueAt: string | Date;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const target = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const [left, setLeft] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const ms = target.getTime() - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.getTime()]);

  if (left <= 0) {
    return (
      <span className={className ?? "text-[10px] text-destructive"}>
        Czas na płatność minął — termin zostanie zwolniony.
      </span>
    );
  }

  const total = Math.floor(left / 1000);
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  const time = `${hh}:${mm}:${ss}`;
  const urgent = total <= 60;

  return (
    <span
      className={
        className ??
        `inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
          urgent ? "bg-destructive/15 text-destructive" : "bg-terracotta/15 text-terracotta"
        }`
      }
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${urgent ? "bg-destructive" : "bg-terracotta"} animate-pulse`} />
      {compact ? time : `Pozostało ${time} na opłacenie`}
    </span>
  );
}
