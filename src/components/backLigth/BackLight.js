import React from "react";

export default function BackLight({
  id = "back-light",
  stdDeviation = 50,
  saturation = 6,
  width = "200%",
  height = "200%",
}) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <filter id={id} y="-50%" x="-50%" width={width} height={height}>
        <feGaussianBlur
          in="SourceGraphic"
          stdDeviation={stdDeviation}
          result="blurred"
        />
        <feColorMatrix type="saturate" in="blurred" values={saturation} />
        <feComposite in="SourceGraphic" operator="over" />
      </filter>
    </svg>
  );
}
