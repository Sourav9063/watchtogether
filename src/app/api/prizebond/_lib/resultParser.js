import "server-only";

const IRD_ORIGIN = "https://prizebond.ird.gov.bd";
const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toAsciiDigits(value = "") {
  return String(value).replace(/[০-৯]/g, (digit) =>
    String(BENGALI_DIGITS.indexOf(digit)),
  );
}

function decodeHtml(value = "") {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function textContent(value = "") {
  return decodeHtml(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function safeIrdUrl(href) {
  if (!href) return null;

  try {
    const url = new URL(decodeHtml(href), IRD_ORIGIN);
    return url.protocol === "https:" && url.hostname === "prizebond.ird.gov.bd"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function getCells(rowHtml) {
  return [...rowHtml.matchAll(/<td\b[^>]*>(.*?)(?=<td\b|<\/tr\s*>|$)/gis)].map(
    (match) => match[1],
  );
}

export function parsePrizeBondResult(html) {
  if (typeof html !== "string" || !/<table\b/i.test(html)) {
    throw new Error("missing result table");
  }

  const normalizedText = toAsciiDigits(textContent(html));
  const summaryMatch = normalizedText.match(
    /Excel Sheet\s*এ\s*(\d+)টির মধ্যে[\s\S]*?(?:(\d+)টি নম্বর ম্যাচ|কোনো নম্বর ম্যাচ করেনি)/i,
  );

  if (!summaryMatch) throw new Error("missing result summary");

  const matches = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>(.*?)<\/tr\s*>/gis)) {
    const cells = getCells(rowMatch[1]);
    if (cells.length < 4) continue;

    const number = toAsciiDigits(textContent(cells[0])).replace(/\D/g, "");
    if (!/^\d{7}$/.test(number)) continue;

    const linkMatch = cells.slice(4).join(" ").match(/href\s*=\s*["']?([^"'\s>]+)/i);
    matches.push({
      number,
      prize: textContent(cells[1]),
      amount: toAsciiDigits(textContent(cells[2])).replace(/[^\d]/g, ""),
      drawDate: toAsciiDigits(textContent(cells[3])),
      drawPdfUrl: safeIrdUrl(linkMatch?.[1]),
    });
  }

  const claimMatch = html.match(
    /href\s*=\s*["']?([^"'\s>]*pbond_claimform\.pdf[^"'\s>]*)/i,
  );
  const uploadedCount = Number(summaryMatch[1]);
  const matchedCount = summaryMatch[2] ? Number(summaryMatch[2]) : 0;

  if (matchedCount !== matches.length) throw new Error("result count mismatch");

  return {
    uploadedCount,
    matchedCount,
    matches,
    claimFormUrl: safeIrdUrl(claimMatch?.[1]),
  };
}
