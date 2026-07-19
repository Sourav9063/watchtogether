"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

import { formatBondNumber, normalizeBondNumber, toBengaliDigits } from "../numberUtils";
import { TEXTS } from "../texts";
import ActionIcon from "./ActionIcon";
import PanelShell from "./PanelShell";
import { css } from "./styles";

export default function PrizeBondScanner({ onAdd }) {
  const videoRef = useRef(null);
  const workerRef = useRef(null);
  const canvasRef = useRef(null);
  const scanTimerRef = useRef(null);
  const recognizingRef = useRef(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [preview, setPreview] = useState("");
  const [detectedNumbers, setDetectedNumbers] = useState({});
  const [lastAccepted, setLastAccepted] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [editing, setEditing] = useState(null);
  const [autoAdd, setAutoAdd] = useState(true);
  const [roi, setRoi] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    clearTimeout(scanTimerRef.current);
    setPreview("");
  }, []);

  useEffect(() => {
    let active = true;
    canvasRef.current = document.createElement("canvas");

    const initializeWorker = async () => {
      try {
        const worker = await Tesseract.createWorker("ben", 1);
        await worker.setParameters({
          tessedit_char_whitelist:
            "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ০১২৩৪৫৬৭৮৯",
          tessjs_create_hocr: "0",
          tessjs_create_tsv: "0",
        });
        if (!active) {
          await worker.terminate();
          return;
        }
        workerRef.current = worker;
        setWorkerReady(true);
      } catch {
        if (active) setCameraError(TEXTS.scanner.scannerError);
      }
    };

    initializeWorker();
    return () => {
      active = false;
      stopCamera();
      workerRef.current?.terminate();
      workerRef.current = null;
      canvasRef.current = null;
    };
  }, [stopCamera]);

  const updateRoi = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) return;
    const width = video.videoWidth * 0.82;
    const height = video.videoHeight * 0.22;
    setRoi({
      x: (video.videoWidth - width) / 2,
      y: (video.videoHeight - height) / 2,
      width,
      height,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateRoi);
    return () => window.removeEventListener("resize", updateRoi);
  }, [updateRoi]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 720 },
          height: { ideal: 480 },
        },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        updateRoi();
        videoRef.current?.play();
      };
      setCameraError("");
    } catch {
      setCameraError(TEXTS.scanner.cameraError);
      setIsScanning(false);
    }
  };

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !isScanning ||
      !workerReady ||
      !video ||
      !canvas ||
      !roi.width ||
      video.readyState < video.HAVE_ENOUGH_DATA
    ) {
      if (isScanning) scanTimerRef.current = setTimeout(scanFrame, 160);
      return;
    }

    if (recognizingRef.current) {
      scanTimerRef.current = setTimeout(scanFrame, 160);
      return;
    }

    recognizingRef.current = true;
    canvas.width = Math.round(roi.width);
    canvas.height = Math.round(roi.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.filter = "grayscale(1) contrast(2) brightness(1.15)";
    context.drawImage(
      video,
      roi.x,
      roi.y,
      roi.width,
      roi.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setPreview(canvas.toDataURL("image/jpeg"));

    try {
      const { data } = await workerRef.current.recognize(canvas);
      setConfidence(data.confidence || 0);
      const found = [];
      const compactText = data.text.replace(/\s/g, "");
      const pattern = /[কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ]{2}([০১২৩৪৫৬৭৮৯]{7})/g;
      for (const match of compactText.matchAll(pattern)) {
        const number = normalizeBondNumber(match[1]);
        if (number) found.push(number);
      }
      if (found.length) {
        setDetectedNumbers((current) => {
          const next = { ...current };
          found.forEach((number) => {
            next[number] = (next[number] || 0) + 1;
          });
          return next;
        });
      }
    } catch {
      setConfidence(0);
    } finally {
      recognizingRef.current = false;
      if (isScanning) scanTimerRef.current = setTimeout(scanFrame, 160);
    }
  }, [isScanning, roi, workerReady]);

  useEffect(() => {
    if (isScanning && workerReady) scanFrame();
    return () => clearTimeout(scanTimerRef.current);
  }, [isScanning, scanFrame, workerReady]);

  const toggleScanning = async () => {
    if (isScanning) {
      setIsScanning(false);
      stopCamera();
      return;
    }
    setIsScanning(true);
    await startCamera();
  };

  const acceptNumber = useCallback(
    (number) => {
      const result = onAdd(number);
      if (result === "duplicate") window.alert(TEXTS.manager.duplicateNumber);
      if (result === "invalid") window.alert(TEXTS.manager.invalidNumber);
      if (result === "added") {
        setLastAccepted(number);
        setDetectedNumbers({});
      }
    },
    [onAdd],
  );

  useEffect(() => {
    if (!autoAdd) return;
    const candidate = Object.entries(detectedNumbers).sort((a, b) => b[1] - a[1])[0];
    if (candidate?.[1] >= 10) acceptNumber(candidate[0]);
  }, [acceptNumber, autoAdd, detectedNumbers]);

  const saveEdited = () => {
    const number = normalizeBondNumber(editing?.value);
    if (!number) {
      window.alert(TEXTS.manager.invalidNumber);
      return;
    }
    setDetectedNumbers((current) => {
      const next = { ...current };
      const frequency = next[editing.id] || 1;
      delete next[editing.id];
      next[number] = frequency;
      return next;
    });
    setEditing(null);
  };

  const submitManual = () => {
    const number = normalizeBondNumber(manualInput);
    if (!number || number.length !== 7) {
      window.alert(TEXTS.manager.invalidNumber);
      return;
    }
    acceptNumber(number);
    setManualInput("");
  };

  const videoWidth = videoRef.current?.videoWidth || 1;
  const videoHeight = videoRef.current?.videoHeight || 1;

  return (
    <PanelShell
      intro={TEXTS.scanner.intro}
      title={TEXTS.scanner.title}
    >
      <div className={css("pb-scanner-layout")}>
        <div className={css("pb-camera-stage")}>
          <video
            autoPlay
            className={css("pb-camera-video")}
            muted
            playsInline
            ref={videoRef}
          />
          {!isScanning && (
            <div className={css("pb-camera-placeholder")}>
              <ActionIcon name="scan" size={48} />
              <span>{workerReady ? TEXTS.scanner.start : TEXTS.scanner.loading}</span>
            </div>
          )}
          {isScanning && roi.width > 0 && (
            <div
              className={css("pb-scan-roi")}
              style={{
                left: `${(roi.x / videoWidth) * 100}%`,
                top: `${(roi.y / videoHeight) * 100}%`,
                width: `${(roi.width / videoWidth) * 100}%`,
                height: `${(roi.height / videoHeight) * 100}%`,
              }}
            />
          )}
          {preview && isScanning && (
            <Image
              alt={TEXTS.scanner.previewAlt}
              className={css("pb-scan-preview")}
              height={50}
              src={preview}
              unoptimized
              width={180}
            />
          )}
          {isScanning && (
            <div className={css("pb-confidence")}>
              {TEXTS.scanner.confidence}
              <strong>{toBengaliDigits(Math.round(confidence))}٪</strong>
            </div>
          )}
        </div>

        <button
          className={css("pb-primary-button", isScanning && "pb-stop-button")}
          disabled={!workerReady}
          onClick={toggleScanning}
          type="button"
        >
          <ActionIcon name="scan" size={21} />
          {isScanning ? TEXTS.scanner.stop : TEXTS.scanner.start}
        </button>

        {cameraError && <p className={css("pb-error")} role="alert">{cameraError}</p>}

        <div className={css("pb-detection-box")}>
          <div className={css("pb-detection-heading")}>
            <h3>{TEXTS.scanner.detected}</h3>
            <label>
              <input
                checked={autoAdd}
                onChange={(event) => setAutoAdd(event.target.checked)}
                type="checkbox"
              />
              <span>{TEXTS.scanner.autoAdd}</span>
            </label>
          </div>
          {!Object.keys(detectedNumbers).length ? (
            <p className={css("pb-empty-state pb-compact-empty")}>{TEXTS.scanner.noDetection}</p>
          ) : (
            <div className={css("pb-detected-list")}>
              {Object.entries(detectedNumbers)
                .sort((a, b) => b[1] - a[1])
                .map(([number, frequency]) => (
                  <div className={css("pb-detected-item")} key={number}>
                    {editing?.id === number ? (
                      <input
                        autoFocus
                        onChange={(event) =>
                          setEditing({ ...editing, value: event.target.value })
                        }
                        value={editing.value}
                      />
                    ) : (
                      <strong>
                        {formatBondNumber(number)}
                        <small>({toBengaliDigits(frequency)})</small>
                      </strong>
                    )}
                    <div>
                      {editing?.id === number ? (
                        <>
                          <button onClick={saveEdited} type="button">{TEXTS.scanner.save}</button>
                          <button onClick={() => setEditing(null)} type="button">{TEXTS.scanner.cancel}</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => acceptNumber(number)} type="button">{TEXTS.scanner.accept}</button>
                          <button
                            onClick={() => setEditing({ id: number, value: formatBondNumber(number) })}
                            type="button"
                          >
                            {TEXTS.scanner.edit}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {lastAccepted && (
          <div className={css("pb-last-accepted")}>
            <span>{TEXTS.scanner.lastAccepted}</span>
            <strong>{formatBondNumber(lastAccepted)}</strong>
          </div>
        )}

        <div className={css("pb-manual-entry")}>
          <div>
            <h3>{TEXTS.scanner.manualTitle}</h3>
            <p>{TEXTS.scanner.manualHint}</p>
          </div>
          <div className={css("pb-manual-controls")}>
            <input
              inputMode="numeric"
              maxLength={7}
              onChange={(event) => {
                const raw = event.target.value.replace(/[^০-৯0-9]/g, "");
                setManualInput(toBengaliDigits(normalizeBondNumber(raw, false) || raw));
              }}
              placeholder={TEXTS.scanner.manualPlaceholder}
              value={manualInput}
            />
            <button
              className={css("pb-primary-button")}
              disabled={!normalizeBondNumber(manualInput) || manualInput.length !== 7}
              onClick={submitManual}
              type="button"
            >
              {TEXTS.scanner.manualSubmit}
            </button>
          </div>
        </div>

        <div className={css("pb-scan-guide")}>
          <h3>{TEXTS.scanner.guideTitle}</h3>
          <ul>
            {TEXTS.scanner.guides.map((guide) => <li key={guide}>{guide}</li>)}
          </ul>
        </div>
      </div>
    </PanelShell>
  );
}
