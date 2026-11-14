type SwitchProps = {
  label: string;
  description?: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
};

// An on/off toggle row, like in phone settings.
export function Switch({ label, description, isOn, onChange }: SwitchProps) {
  let trackColor = "bg-muted";
  let knobPosition = "translate-x-0.5";
  if (isOn) {
    trackColor = "bg-primary";
    knobPosition = "translate-x-[22px]";
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={() => onChange(!isOn)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3 text-left shadow-sm"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </span>
      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${trackColor}`}
      >
        <span
          className={`size-6 rounded-full bg-background shadow-sm transition-transform ${knobPosition}`}
        />
      </span>
    </button>
  );
}
