import { NextResponse } from "next/server";

import { API_MESSAGES } from "../_lib/messages";
import { parsePrizeBondResult } from "../_lib/resultParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IRD_ENDPOINT = "https://prizebond.ird.gov.bd/multiple_action.php";
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function json(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: API_MESSAGES.multipartRequired }, 400);
  }

  const file = formData.get("file");
  const extensionIsValid =
    typeof file?.name === "string" && /\.(xlsx|xls)$/i.test(file.name);
  const mimeIsValid = !file?.type || EXCEL_MIME_TYPES.has(file.type);

  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ error: API_MESSAGES.fileRequired }, 400);
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return json({ error: API_MESSAGES.invalidSize }, 400);
  }
  if (!extensionIsValid || !mimeIsValid) {
    return json({ error: API_MESSAGES.invalidType }, 400);
  }

  const upstreamForm = new FormData();
  upstreamForm.append(
    "file",
    new Blob([await file.arrayBuffer()], { type: file.type }),
    file.name,
  );

  try {
    const response = await fetch(IRD_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        Origin: "https://prizebond.ird.gov.bd",
        Referer: "https://prizebond.ird.gov.bd/MultipleNumbers.php",
      },
      body: upstreamForm,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return json({ error: API_MESSAGES.rejected }, 502);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return json({ error: API_MESSAGES.unexpected }, 502);
    }

    try {
      return json(parsePrizeBondResult(await response.text()));
    } catch {
      return json(
        { error: API_MESSAGES.changed },
        502,
      );
    }
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    return json(
      {
        error: timedOut
          ? API_MESSAGES.timeout
          : API_MESSAGES.unavailable,
      },
      timedOut ? 504 : 502,
    );
  }
}
