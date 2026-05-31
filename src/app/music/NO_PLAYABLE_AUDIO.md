# Handover: "No playable audio source found" (YouTube Extractor)

## The Problem
When deployed to Vercel (or similar datacenters), the YouTube music extractor consistently failed with a `404 No playable audio source found` error, specifically caused by the InnerTube player API returning `LOGIN_REQUIRED` or `UNPLAYABLE` for all requests. 

This happens because YouTube aggressively blacklists datacenter IP addresses (like AWS and Vercel) to prevent bot scraping. Any anonymous player requests originating from these IPs are rejected.

## Solutions Tried

### 1. Robust Video ID Extraction
- **What was tried:** Improved the `searchVideoId` function to use the official InnerTube Search API first, and fall back to HTML scraping with an injected `CONSENT=YES` cookie to bypass EU consent blockers.
- **Result:** Worked perfectly for finding the Video ID, but didn't solve the core issue, as the subsequent stream resolution was still being blocked.

### 2. Expanding Fallback Clients
- **What was tried:** Added more client contexts (`WEB`, `MWEB`, `WEB_EMBED`, `TVHTML5`) alongside the existing mobile clients (`IOS`, `ANDROID`).
- **Result:** **Failed.** YouTube returned `LOGIN_REQUIRED` or `UNPLAYABLE` for *every* client. Since mid-2024, YouTube requires Proof of Origin (PoToken) or authentication for mobile/web clients originating from flagged IPs.

### 3. Forcing IPv4 via DNS Override
- **What was tried:** Added `dns.setDefaultResultOrder("ipv4first");` to force Node.js `fetch` to route traffic through Vercel's IPv4 NAT instead of IPv6. Vercel's IPv6 ranges are notoriously blocked by YouTube.
- **Result:** **Failed.** While this is a common fix for many Vercel deployments, in this specific case, the assigned IPv4 address was also fully blacklisted by YouTube, still resulting in `LOGIN_REQUIRED`.

### 4. Passing an Anonymous Cookie
- **What was tried:** Added support for a `YOUTUBE_COOKIE` environment variable and passed an anonymous cookie (containing `VISITOR_INFO1_LIVE`).
- **Result:** **Failed.** Anonymous cookies are heavily tied to the IP address they are used on. Because the Vercel IP was flagged, YouTube still rejected the anonymous session and demanded a login.

### 5. Final Fix: Authenticated Cookies with SAPISIDHASH
- **What was tried:** Passed a **logged-in** YouTube cookie via environment variables, and implemented the cryptographic `getSapisidHash` function to generate an `Authorization: SAPISIDHASH ...` header. 
- **Result:** **Success.** When you pass a logged-in cookie (containing `SAPISID` or `__Secure-3PAPISID`), the InnerTube API strictly requires an `Authorization` hash to verify the cookie's origin. By generating and injecting this header, the request is fully authenticated, overriding the datacenter IP ban entirely and successfully retrieving the audio streams.

## Next Steps / Maintenance
To maintain this fix, a valid logged-in `YOUTUBE_COOKIE` must be kept in the Vercel environment variables. If the cookie expires or the dummy account is logged out, the application will revert to failing with `LOGIN_REQUIRED`. The cookie should be periodically refreshed (typically valid for 1-2 years unless explicitly invalidated).
