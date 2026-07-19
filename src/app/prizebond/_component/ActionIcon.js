import { css } from "./styles";

const ICON_PATHS = {
  scan: (
    <>
      <path d="M8 7.5 9.8 5h4.4L16 7.5" />
      <rect x="4" y="7.5" width="16" height="11.5" rx="2.5" />
      <circle cx="12" cy="13.2" r="3.2" />
      <path d="M6.5 4v2M4 6.5h2M17.5 4v2M20 6.5h-2" />
    </>
  ),
  manage: (
    <>
      <path d="M7 4.5h10v15H7z" />
      <path d="M9.5 8h5M9.5 11.5h5M9.5 15h3" />
      <path d="M4 7v14h10" />
      <circle cx="17.5" cy="16.5" r="3" />
      <path d="m16.2 16.5.9.9 1.8-2" />
    </>
  ),
  transfer: (
    <>
      <path d="M5 7h11" />
      <path d="m13 4 3 3-3 3" />
      <path d="M19 17H8" />
      <path d="m11 14-3 3 3 3" />
      <path d="M4 11.5v-5A2.5 2.5 0 0 1 6.5 4H9M20 12.5v5a2.5 2.5 0 0 1-2.5 2.5H15" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.2 2.5 2.5 5.3-5.6" />
      <path d="M12 1.8v2M12 20.2v2M1.8 12h2M20.2 12h2" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 10v9.5h11V10M10 19.5v-6h4v6" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  edit: (
    <>
      <path d="m14.5 5.5 4 4M5 19l3.5-.7L19 7.8a1.5 1.5 0 0 0 0-2.1l-.7-.7a1.5 1.5 0 0 0-2.1 0L5.7 15.5z" />
      <path d="m13.8 7.4 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M5 18v2h14v-2" />
    </>
  ),
  upload: (
    <>
      <path d="M12 17V5M8 9l4-4 4 4" />
      <path d="M5 18v2h14v-2" />
    </>
  ),
};

export default function ActionIcon({ name, size = 24 }) {
  return (
    <svg
      aria-hidden="true"
      className={css("pb-icon")}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {ICON_PATHS[name]}
      </g>
    </svg>
  );
}
