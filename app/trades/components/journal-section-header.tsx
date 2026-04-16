import type { ReactNode } from "react";

type JournalSectionHeaderProps = {
  title: string;
  description: string;
  mutedClassName: string;
  actions?: ReactNode;
};

export function JournalSectionHeader({
  title,
  description,
  mutedClassName,
  actions,
}: JournalSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className={`mt-1 text-sm ${mutedClassName}`}>{description}</p>
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
