// A line of red text under a form or a button: what went wrong.
export function FormError({ children }: { children: string }) {
  return (
    <p role="alert" className="px-1 text-sm text-destructive">
      {children}
    </p>
  );
}
