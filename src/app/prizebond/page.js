"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import styles from "./prizebond.module.css";

const PrizeBondOCR = dynamic(() => import("@/components/PrizeBondOCR"), {
  ssr: false,
  loading: () => <div>Loading OCR Component...</div>,
});

export default function PrizeBondPage() {
  const [savedNumbers, setSavedNumbers] = useState([]);
  const [showCheckButtons, setShowCheckButtons] = useState(false);
  const [irdCheck, setIrdCheck] = useState({
    status: "idle",
    data: null,
    error: "",
  });

  useEffect(() => {
    // Load saved numbers from localStorage
    const stored = localStorage.getItem("prizeBondNumbers");
    if (stored) {
      setSavedNumbers(JSON.parse(stored));
    }
  }, []);

  const handleNumberDetected = (number) => {
    const timestamp = new Date().toISOString();
    const newEntry = { number, timestamp };

    setSavedNumbers((prev) => {
      const exist = prev.find((entry) => entry.number === number);
      if (exist) {
        return prev;
      }

      let updated = [...prev, newEntry].sort((a, b) => a.number - b.number);
      localStorage.setItem("prizeBondNumbers", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDelete = (number) => {
    setSavedNumbers((prev) => {
      const updated = prev.filter((entry) => entry.number !== number);
      localStorage.setItem("prizeBondNumbers", JSON.stringify(updated));
      return updated.sort((a, b) => a.number - b.number);
    });
  };

  const handleEdit = (number) => {
    const entryToEdit = savedNumbers.find((entry) => entry.number === number);
    if (!entryToEdit) return;

    const newNumber = prompt("Enter new number", entryToEdit.number);
    if (newNumber && newNumber.trim()) {
      setSavedNumbers((prev) => {
        const updated = prev.map((entry) =>
          entry.number === number
            ? { ...entry, number: newNumber.trim() }
            : entry,
        );
        localStorage.setItem("prizeBondNumbers", JSON.stringify(updated));
        return updated.sort((a, b) => a.number - b.number);
      });
    }
  };

  const clearNumbers = () => {
    if (window.confirm("Are you sure you want to delete all saved numbers?")) {
      setSavedNumbers([]);
      localStorage.removeItem("prizeBondNumbers");
    }
  };

    const handleSortAndDeduplicate = () => {
    setSavedNumbers((prev) => {
      // Use a Map to maintain insertion order while ensuring uniqueness based on the number
      const uniqueNumbers = new Map();
      prev.forEach(entry => {
        if (!uniqueNumbers.has(entry.number)) {
          uniqueNumbers.set(entry.number, entry);
        }
      });

      const updated = Array.from(uniqueNumbers.values()).sort(
        (a, b) => a.number - b.number
      );
      
      localStorage.setItem("prizeBondNumbers", JSON.stringify(updated));
      alert(`${prev.length - updated.length} duplicate(s) removed and list sorted.`);
      return updated;
    });
  };

  const copyNumbers = () => {
    const numbersToCopy = savedNumbers.map((entry) => entry.number).join("\n");
    navigator.clipboard
      .writeText(numbersToCopy)
      .then(() => {
        alert("All numbers copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy numbers: ", err);
        alert("Failed to copy numbers. Please try again.");
      });
  };

  const getValidNumbers = () =>
    savedNumbers
      .map((entry) => String(entry.number).trim())
      .filter((number) => /^\d{1,7}$/.test(number))
      .map((number) => number.padStart(7, "0"));

  const createWorkbook = () => {
    const ws = XLSX.utils.aoa_to_sheet(
      getValidNumbers().map((number) => [number]),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prize Bonds");
    return wb;
  };

  const getExportFilename = () => {
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
      now.getHours(),
    ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    return `prizebond-backup-${dateTime}.xlsx`;
  };

  const exportToExcel = () => {
    XLSX.writeFile(createWorkbook(), getExportFilename());
  };

  const checkAllWithIrd = async () => {
    const validNumbers = getValidNumbers();
    if (validNumbers.length === 0) {
      setIrdCheck({
        status: "error",
        data: null,
        error: "Add at least one valid prize bond number before checking.",
      });
      return;
    }

    if (validNumbers.length !== savedNumbers.length) {
      setIrdCheck({
        status: "error",
        data: null,
        error: "Every saved prize bond must contain no more than 7 digits.",
      });
      return;
    }

    setIrdCheck({ status: "loading", data: null, error: "" });

    try {
      const workbookBytes = XLSX.write(createWorkbook(), {
        bookType: "xlsx",
        type: "array",
      });
      const file = new File([workbookBytes], getExportFilename(), {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/prizebond/check", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Prize bond check failed.");
      }

      setIrdCheck({ status: "success", data: result, error: "" });
    } catch (error) {
      setIrdCheck({
        status: "error",
        data: null,
        error: error.message || "Prize bond check failed.",
      });
    }
  };

  const handleCheck = (chunkIndex) => {
    const chunkSize = 100;
    const start = chunkIndex * chunkSize;
    const end = start + chunkSize;
    const chunk = savedNumbers.slice(start, end);

    if (chunk.length === 0) {
      alert("No numbers in this range.");
      return;
    }

    const paddedNumbers = chunk.map((entry) =>
      String(entry.number).padStart(7, "0"),
    );
    const numbersToCheck = paddedNumbers.join(",");
    const url = `https://www.bb.org.bd/en/index.php/investfacility/prizebond?gsearch=${encodeURIComponent(
      numbersToCheck,
    )}`;
    window.open(url, "_blank");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const newNumbers = json
        .flat()
        .map(String)
        .filter((num) => num.trim().length > 0);

      setSavedNumbers((prev) => {
        const existingNumbers = new Set(prev.map((entry) => entry.number));
        const uniqueNewEntries = newNumbers
          .filter((number) => !existingNumbers.has(number) && Number.isInteger(+number))
          .map((number) => ({ number, timestamp: new Date().toISOString() }));

        const updated = [...prev, ...uniqueNewEntries].sort(
          (a, b) => a.number - b.number,
        );
        localStorage.setItem("prizeBondNumbers", JSON.stringify(updated));
        alert(`${uniqueNewEntries.length} new numbers imported.`);
        return updated;
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; // Reset file input
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Bangladesh Prize Bond Scanner</h1>
        <p>Scan your prize bond numbers using camera</p>
      </header>

      <div className={styles.content}>
        <section className={styles.scanSection}>
          <h2>Scan Prize Bond Numbers</h2>
          <PrizeBondOCR onNumberDetected={handleNumberDetected} />
        </section>

        <section className={styles.resultsSection}>
          {/* <div className={styles.winningNumbers}>
            <h3>Current Winning Numbers (120th Draw)</h3>
            <div className={styles.prizeList}>
              <div className={styles.prizeItem}>
                <span className={styles.prizeLabel}>1st Prize (৳6,00,000):</span>
                <span className={styles.prizeNumber}>{winningNumbers.first}</span>
              </div>
              <div className={styles.prizeItem}>
                <span className={styles.prizeLabel}>2nd Prize (৳3,25,000):</span>
                <span className={styles.prizeNumber}>{winningNumbers.second.join(', ')}</span>
              </div>
              <div className={styles.prizeItem}>
                <span className={styles.prizeLabel}>3rd Prize (৳1,00,000):</span>
                <span className={styles.prizeNumber}>{winningNumbers.third.join(', ')}</span>
              </div>
              <div className={styles.prizeItem}>
                <span className={styles.prizeLabel}>4th Prize (৳50,000):</span>
                <span className={styles.prizeNumber}>{winningNumbers.fourth.join(', ')}</span>
              </div>
            </div>
          </div> */}

          <div className={styles.scannedNumbers}>
            <div className={styles.scannedHeader}>
              <h2>Scanned Numbers ({savedNumbers.length})</h2>
              <div className={styles.buttonGroup}>
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <button
                    onClick={exportToExcel}
                    className={styles.exportButton}
                  >
                    Export
                  </button>
                  <button
                    onClick={checkAllWithIrd}
                    className={styles.checkAllButton}
                    disabled={
                      savedNumbers.length === 0 || irdCheck.status === "loading"
                    }
                  >
                    {irdCheck.status === "loading" ? "Checking..." : "Check All"}
                  </button>
                  <label className={styles.importButton}>
                    Import
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button onClick={copyNumbers} className={styles.copyButton}>
                    Copy All
                  </button>
                  <button onClick={clearNumbers} className={styles.clearButton}>
                    Clear All
                  </button> 
                </div>
                  <button
                    onClick={handleSortAndDeduplicate}
                    className={styles.copyButton}
                  >
                    Sort & Deduplicate
                  </button>
                {!showCheckButtons ? (
                  <button
                    onClick={() => setShowCheckButtons(true)}
                    className={styles.exportButton}
                  >
                    Check
                  </button>
                ) : (
                  Array.from({
                    length: Math.ceil(savedNumbers.length / 100),
                  }).map((_, index) => {
                    const start = index * 100 + 1;
                    const end = Math.min(
                      (index + 1) * 100,
                      savedNumbers.length,
                    );
                    return (
                      <button
                        key={index}
                        onClick={() => handleCheck(index)}
                        className={styles.exportButton}
                      >
                        Check ({start} - {end})
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {irdCheck.status === "error" && (
              <div className={styles.checkError} role="alert">
                {irdCheck.error}
              </div>
            )}

            {irdCheck.status === "success" && (
              <div className={styles.checkResults} aria-live="polite">
                <div className={styles.checkSummary}>
                  Checked {irdCheck.data.uploadedCount} number(s). Found{" "}
                  {irdCheck.data.matchedCount} match(es).
                </div>
                {irdCheck.data.matches.length === 0 ? (
                  <p className={styles.noMatches}>No winning numbers found.</p>
                ) : (
                  <div className={styles.matchList}>
                    {irdCheck.data.matches.map((match) => (
                      <div key={`${match.number}-${match.drawDate}`} className={styles.matchItem}>
                        <strong>{match.number}</strong>
                        <span>{match.prize}</span>
                        <span>৳{Number(match.amount).toLocaleString("en-US")}</span>
                        <span>{match.drawDate}</span>
                        {match.drawPdfUrl && (
                          <a
                            href={match.drawPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Draw details
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {irdCheck.data.claimFormUrl && irdCheck.data.matchedCount > 0 && (
                  <a
                    className={styles.claimLink}
                    href={irdCheck.data.claimFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download prize claim form
                  </a>
                )}
              </div>
            )}

            <div className={styles.numbersList}>
              {savedNumbers.length === 0 ? (
                <p className={styles.emptyState}>No numbers scanned yet</p>
              ) : (
                [...savedNumbers].reverse().map((entry, index) => {
                  return (
                    <div
                      key={index}
                      className={styles.numberItem}
                    >
                      <span className={styles.number}>
                        {entry.number?.padStart(7, "0")}
                      </span>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(entry.number)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.number)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.info}>
          <h4>About Prize Bonds</h4>
          <ul>
            <li>Prize bonds are issued in ৳100 denomination</li>
            <li>Draws held quarterly: Jan 31, Apr 30, Jul 30, Oct 31</li>
            <li>Same number wins in all series</li>
            <li>Claim prizes within 2 years of draw date</li>
            <li>Check results at www.bb.org.bd</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
