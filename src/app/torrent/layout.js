import React from 'react';

export default function TorrentLayout({ children }) {
  return (
    <>
      {children}
      <script src="https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js" charSet="utf-8" async></script>
    </>
  );
}