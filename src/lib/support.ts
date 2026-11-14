// The Telegram username customers write to with questions ("Написать админу"),
// without "@". Not a secret, so it is a NEXT_PUBLIC_ variable: Next puts its
// value into the browser code at build time. Null when it isn't set —
// then the button is hidden.
export const SUPPORT_USERNAME: string | null =
  process.env.NEXT_PUBLIC_SUPPORT_USERNAME || null;
