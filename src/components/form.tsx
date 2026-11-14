import type { ComponentProps, ReactNode } from "react";

const INPUT_CLASSES =
  "w-full rounded-xl border border-input bg-input/30 px-4 py-3 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50";

type FieldProps = {
  label: string;
  children: ReactNode;
};

// A form field: a label and an input under it.
export function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input className={INPUT_CLASSES} {...props} />;
}

// A native drop-down: on a phone it opens the system's own picker.
export function Select(props: ComponentProps<"select">) {
  return <select className={INPUT_CLASSES} {...props} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea className={`${INPUT_CLASSES} resize-none`} {...props} />;
}
