type JournalStatCardProps = {
  label: string;
  value: string;
  detail?: string;
  toneClassName?: string;
  cardClassName: string;
  mutedClassName: string;
  valueClassName?: string;
};

export function JournalStatCard({
  label,
  value,
  detail,
  toneClassName = "",
  cardClassName,
  mutedClassName,
  valueClassName = "text-2xl",
}: JournalStatCardProps) {
  return (
    <div className={cardClassName}>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClassName}`}
      >
        {label}
      </p>
      <p className={`mt-3 font-semibold tracking-tight ${valueClassName} ${toneClassName}`}>
        {value}
      </p>
      {detail ? <p className={`mt-2 text-sm ${mutedClassName}`}>{detail}</p> : null}
    </div>
  );
}
