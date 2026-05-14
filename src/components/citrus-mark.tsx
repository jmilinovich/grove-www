import type { JSX } from "react";

interface CitrusMarkProps {
  size?: number;
  className?: string;
  title?: string;
}

export function CitrusMark({
  size = 20,
  className = "",
  title,
}: CitrusMarkProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M14.5 12 L22.5 12" />
      <path d="M13.77 13.77 L19.43 19.43" />
      <path d="M12 14.5 L12 22.5" />
      <path d="M10.23 13.77 L4.57 19.43" />
      <path d="M9.5 12 L1.5 12" />
      <path d="M10.23 10.23 L4.57 4.57" />
      <path d="M12 9.5 L12 1.5" />
      <path d="M13.77 10.23 L19.43 4.57" />
    </svg>
  );
}
