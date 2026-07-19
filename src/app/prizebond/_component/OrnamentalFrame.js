import { useId } from "react";

import CornerOrnament from "./CornerOrnament";
import { css } from "./styles";

export default function OrnamentalFrame({ children, className = "" }) {
  const svgId = useId().replaceAll(":", "");
  const horizontalPatternId = `${svgId}-horizontal`;
  const verticalPatternId = `${svgId}-vertical`;

  return (
    <div className={css("pb-ornamental-frame", className)}>
      <svg
        aria-hidden="true"
        className={css("pb-border-art")}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern
            id={horizontalPatternId}
            height="3"
            patternUnits="userSpaceOnUse"
            width="10"
          >
            <path
              d="M0 1.5h1L2.2.3l1.3 1.2L4.8.3 6 1.5 7.2.3l1.3 1.2H10"
              fill="none"
              stroke="currentColor"
              strokeWidth=".38"
            />
            <rect
              x="4.35"
              y=".85"
              width="1.3"
              height="1.3"
              fill="none"
              stroke="var(--pb-rose)"
              strokeWidth=".28"
              transform="rotate(45 5 1.5)"
            />
            <circle cx=".55" cy="1.5" r=".25" fill="var(--pb-gold)" />
            <circle cx="9.45" cy="1.5" r=".25" fill="var(--pb-gold)" />
          </pattern>
          <pattern
            id={verticalPatternId}
            height="10"
            patternUnits="userSpaceOnUse"
            width="3"
          >
            <path
              d="M1.5 0v1L.3 2.2l1.2 1.3L.3 4.8 1.5 6l-1.2 1.2 1.2 1.3V10"
              fill="none"
              stroke="currentColor"
              strokeWidth=".38"
            />
            <rect
              x=".85"
              y="4.35"
              width="1.3"
              height="1.3"
              fill="none"
              stroke="var(--pb-rose)"
              strokeWidth=".28"
              transform="rotate(45 1.5 5)"
            />
            <circle cx="1.5" cy=".55" r=".25" fill="var(--pb-gold)" />
            <circle cx="1.5" cy="9.45" r=".25" fill="var(--pb-gold)" />
          </pattern>
        </defs>
        <rect x=".7" y=".7" width="98.6" height="98.6" rx="1" fill="none" stroke="currentColor" strokeWidth=".36" />
        <rect x="1" y=".8" width="98" height="2.7" fill={`url(#${horizontalPatternId})`} />
        <rect
          x="1"
          y="96.5"
          width="98"
          height="2.7"
          fill={`url(#${horizontalPatternId})`}
          transform="rotate(180 50 97.85)"
        />
        <rect x=".8" y="1" width="2.7" height="98" fill={`url(#${verticalPatternId})`} />
        <rect
          x="96.5"
          y="1"
          width="2.7"
          height="98"
          fill={`url(#${verticalPatternId})`}
          transform="rotate(180 97.85 50)"
        />
        <rect x="3.8" y="3.8" width="92.4" height="92.4" rx="1" fill="none" stroke="var(--pb-gold)" strokeWidth=".55" />
        <rect x="4.7" y="4.7" width="90.6" height="90.6" rx="1" fill="none" stroke="var(--pb-rose)" strokeWidth=".25" />
      </svg>
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />
      <div className={css("pb-frame-content")}>{children}</div>
    </div>
  );
}
