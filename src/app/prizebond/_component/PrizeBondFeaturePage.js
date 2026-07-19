"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TEXTS } from "../texts";
import { createWorkbook, getExportFilename, getValidNumbers } from "../workbook";
import BondManager from "./BondManager";
import CheckPanel from "./CheckPanel";
import PrizeBondFooter from "./PrizeBondFooter";
import TransferPanel from "./TransferPanel";
import { css } from "./styles";
import usePrizeBondStore from "./usePrizeBondStore";

const PrizeBondScanner = dynamic(() => import("./PrizeBondScanner"), {
  ssr: false,
  loading: () => <p className={css("pb-loading")}>{TEXTS.scanner.loading}</p>,
});

export default function PrizeBondFeaturePage({ feature }) {
  const router = useRouter();
  const store = usePrizeBondStore();
  const [resultState, setResultState] = useState({
    status: "idle",
    data: null,
    error: "",
  });

  const checkAllNumbers = async () => {
    const numbers = getValidNumbers(store.entries);
    if (!numbers.length) {
      setResultState({ status: "error", data: null, error: TEXTS.check.noValid });
      return;
    }
    if (numbers.length !== store.entries.length) {
      setResultState({ status: "error", data: null, error: TEXTS.check.invalidSaved });
      return;
    }

    setResultState({ status: "loading", data: null, error: "" });
    try {
      const XLSX = await import("xlsx");
      const bytes = XLSX.write(createWorkbook(XLSX, numbers), {
        bookType: "xlsx",
        type: "array",
      });
      const file = new File([bytes], getExportFilename(), {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/prizebond/check", { method: "POST", body });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        setResultState({
          status: "error",
          data: null,
          error: result?.error || TEXTS.check.failed,
        });
        return;
      }
      setResultState({ status: "success", data: result, error: "" });
    } catch {
      setResultState({ status: "error", data: null, error: TEXTS.check.failed });
    }
  };

  const openFallback = (chunkIndex) => {
    const chunk = getValidNumbers(store.entries).slice(
      chunkIndex * 100,
      chunkIndex * 100 + 100,
    );
    if (!chunk.length) {
      window.alert(TEXTS.check.noRange);
      return;
    }
    const search = encodeURIComponent(chunk.join(","));
    window.open(
      `https://www.bb.org.bd/en/index.php/investfacility/prizebond?gsearch=${search}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const renderFeature = () => {
    if (feature === "scan") return <PrizeBondScanner onAdd={store.addNumber} />;
    if (feature === "bonds") return <BondManager store={store} />;
    if (feature === "import") {
      return (
        <TransferPanel
          onImportSuccess={() => router.push("/prizebond/bonds")}
          store={store}
        />
      );
    }
    return (
      <CheckPanel
        entries={store.entries}
        onCheck={checkAllNumbers}
        onFallback={openFallback}
        resultState={resultState}
      />
    );
  };

  return (
    <main className={css("pb-page")} lang="bn">
      <div className={css("pb-certificate", "pb-route-certificate")}>
        <div className={css("pb-route-content")}>
          {renderFeature()}
        </div>
        <PrizeBondFooter />
      </div>
    </main>
  );
}
