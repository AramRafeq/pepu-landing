import C from "~/styles/checkout.module.css";

/**
 * The checkout's building blocks, shared by /subscribe and the parent pay
 * page (/pay) so both look and behave the same.
 */

/** The site's chunky button: a <button>, or an <a> when given href. */
export function Btn({ variant = "primary", loading = false, disabled = false, href, className = "", children, ...rest }) {
  const variants = {
    primary: C.btnPrimary, fib: C.btnFib, ghost: C.btnGhost, parent: C.btnParent,
    apple: C.btnApple, danger: C.btnDanger, whatsapp: C.btnWhatsapp,
  };
  const cls = `${C.btn} ${variants[variant] ?? ""} ${className}`;
  const body = <>{loading && <span className={C.spinner} />}{children}</>;
  if (href) {
    return <a className={cls} href={href} aria-disabled={disabled || undefined} {...rest}>{body}</a>;
  }
  return <button type="button" className={cls} disabled={disabled || loading} {...rest}>{body}</button>;
}

export const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
       strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

export const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const BoltIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffb02e" stroke="#1d1530" strokeWidth="1.6"
       strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);

export const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9241fe" strokeWidth="2.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-2.5-5.1" />
  </svg>
);
