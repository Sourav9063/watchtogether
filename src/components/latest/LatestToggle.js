"use client";
import React, { useState } from "react";
import LatestMedia, { LatestType } from "./LatestMedia";

export default function LatestToggle({ children }) {
  const [selected, setSelected] = useState("latest release");
  function handleSelectChange(event) {
    setSelected(event.target.value);
  }
  return (
    <>
      <div>
        <select value={selected} onChange={handleSelectChange}>
          <option value="latest release">Latest Releases</option>
          <option value="newly added">Newly Added</option>
        </select>
      </div>

      {selected === "latest release" ? children : null}
    </>
  );
}
