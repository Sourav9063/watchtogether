import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import React, { Suspense } from "react";

export default function ServerComponentWrapper({ children }) {
  return (
    <ErrorBoundary fallback={<div>Error</div>}>
      <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
    </ErrorBoundary>
  );
}
