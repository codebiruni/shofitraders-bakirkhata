import { cn } from "@/lib/cn";

interface Props {
  status: "paid" | "due";
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const due = status === "due";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        due
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-success/30 bg-success/10 text-success",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          due ? "bg-warning" : "bg-success"
        )}
      />
      {due ? "বাকি আছে" : "মিটেছে"}
    </span>
  );
}
