import React from "react";
import IframeDataProvider from "./IframeDataProvider";

export default function ProviderWrapper({ children }) {
  return <IframeDataProvider>{children}</IframeDataProvider>;
}
