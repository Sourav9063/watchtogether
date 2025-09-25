"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import styles from "./PrizeBondOCR.module.css";

const PrizeBondOCR = ({ onNumberDetected }) => {
  const videoRef = useRef(null);
  const workerRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const roiRef = useRef(null);
  const canvasRef = useRef(null); // Ref for the canvas element
  const contextRef = useRef(null); // Ref for the 2D rendering context
  const isRecognizingRef = useRef(false); // To prevent concurrent OCR recognition

  const [isScanning, setIsScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [workerReady, setWorkerReady] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [manualInput, setManualInput] = useState("");
  const [detectedNumbers, setDetectedNumbers] = useState({});
  const [editingNumber, setEditingNumber] = useState(null); // { id: string, value: string }
  const [canvasPreview, setCanvasPreview] = useState("");
  const [roi, setRoi] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [autoAdd, setAutoAdd] = useState(true);

  // Initialize Tesseract worker
  useEffect(() => {
    const initializeWorker = async () => {
      const worker = await Tesseract.createWorker("ben", 1);
      await worker.setParameters({
        tessedit_char_whitelist: "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ০১২৩৪৫৬৭৮৯",
        tessjs_create_hocr: "0",
        tessjs_create_tsv: "0",
      });
      workerRef.current = worker;
      setWorkerReady(true);
    };

    initializeWorker();

    // Initialize canvas and context once
    canvasRef.current = document.createElement("canvas");
    contextRef.current = canvasRef.current.getContext("2d", {
      willReadFrequently: true,
    });

    return () => {
      workerRef.current?.terminate();
      setWorkerReady(false);
      // Clean up canvas and context
      canvasRef.current = null;
      contextRef.current = null;
    };
  }, []);

  // Update ROI on window resize and video metadata load
  const updateRoi = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Define ROI as a percentage of the video dimensions
      const roiWidth = videoWidth * 0.8; // 80% of video width
      const roiHeight = videoHeight * 0.2; // 20% of video height
      const roiX = (videoWidth - roiWidth) / 2;
      const roiY = (videoHeight - roiHeight) / 2;

      setRoi({ x: roiX, y: roiY, width: roiWidth, height: roiHeight });
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadedmetadata", updateRoi);
      window.addEventListener("resize", updateRoi);

      return () => {
        video.removeEventListener("loadedmetadata", updateRoi);
        window.removeEventListener("resize", updateRoi);
      };
    }
  }, [updateRoi]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 720 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          updateRoi();
          videoRef.current.play(); // Ensure video starts playing
        };
      }
      setCameraError("");
    } catch (err) {
      console.error("Camera Error:", err);
      setCameraError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    clearTimeout(scanTimeoutRef.current);
    setCanvasPreview("");
  };

  const toggleScanning = () => {
    const nextIsScanning = !isScanning;
    setIsScanning(nextIsScanning);
    if (nextIsScanning) {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const translateBengaliToEnglish = (bengaliNumber) => {
    const bengaliNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const englishNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return bengaliNumber
      .split("")
      .map((char) => {
        const index = bengaliNumerals.indexOf(char);
        return index !== -1 ? englishNumerals[index] : "";
      })
      .join("");
  };

  const scanFrame = useCallback(async () => {
    if (
      !isScanning ||
      !workerReady ||
      !videoRef.current ||
      videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA
    ) {
      if (isScanning) {
        scanTimeoutRef.current = setTimeout(scanFrame, 100);
      }
      return;
    }

    if (isRecognizingRef.current) {
      scanTimeoutRef.current = setTimeout(scanFrame, 100);
      return;
    }

    isRecognizingRef.current = true; // Set flag to indicate recognition is in progress

    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (!canvas || !context) {
      isRecognizingRef.current = false;
      if (isScanning) {
        scanTimeoutRef.current = setTimeout(scanFrame, 100);
      }
      return;
    }

    canvas.width = roi.width;
    canvas.height = roi.height;

    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing

    // Draw the ROI from the video onto the canvas
    context.drawImage(
      videoRef.current,
      roi.x,
      roi.y,
      roi.width,
      roi.height,
      0,
      0,
      roi.width,
      roi.height,
    );

    // Image preprocessing
    // Apply filter to the context, then draw the image to apply it
    context.filter = "grayscale(1) contrast(2) brightness(1.2)";
    context.drawImage(canvas, 0, 0, canvas.width, canvas.height); // Re-draw to apply filter

    setCanvasPreview(canvas.toDataURL("image/jpeg"));

    let data;
    try {
      ({ data } = await workerRef.current.recognize(canvas));
      setConfidence(data.confidence);
    } catch (error) {
      console.error("OCR recognition error:", error);
      setConfidence(0); // Reset confidence on error
      isRecognizingRef.current = false; // Reset flag even on error
      if (isScanning) {
        scanTimeoutRef.current = setTimeout(scanFrame, 100);
      }
      return;
    } finally {
      isRecognizingRef.current = false; // Reset flag after recognition
    }

    const texts = data.text
      .split("\n")
      .map((text) => text.replace(/\s/g, ""))
      .filter((text) => text.length >= 7); // More flexible length

    if (texts.length > 0) {
      const newNumbers = [];
      // Regex to match 2 characters (Bengali or English letters) followed by 7 Bengali digits
      // The first part (2 chars) is a non-capturing group, and the 7 digits are a capturing group.
      const prizeBondRegex =
        /(?:[কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ]{2})([০১২৩৪৫৬৭৮৯]{7})/g;

      texts.forEach((cleanedText) => {
        let match;
        while ((match = prizeBondRegex.exec(cleanedText)) !== null) {
          // The prize bond number is in the first capturing group (index 1)
          const bengaliNumber = match[1];
          const detectedEnglish = translateBengaliToEnglish(bengaliNumber);
          if (detectedEnglish.length === 7) {
            newNumbers.push(detectedEnglish);
          }
        }
      });

      if (newNumbers.length > 0) {
        setDetectedNumbers((prevFrequencies) => {
          const newFrequencies = { ...prevFrequencies };
          newNumbers.forEach((num) => {
            newFrequencies[num] = (newFrequencies[num] || 0) + 1;
          });
          return newFrequencies;
        });
      }
    }

    // Loop the scan
    if (isScanning) {
      scanTimeoutRef.current = setTimeout(scanFrame, 100); // Scan more frequently
    }
  }, [isScanning, workerReady, roi, onNumberDetected, detectedNumbers]);

  // Start and stop scanning loop
  useEffect(() => {
    if (isScanning && workerReady) {
      scanFrame();
    } else {
      clearTimeout(scanTimeoutRef.current);
    }
    return () => clearTimeout(scanTimeoutRef.current);
  }, [isScanning, workerReady, scanFrame]);

  const handleAccept = useCallback(
    (number) => {
      onNumberDetected(number);
      if (autoAdd) {
        setDetectedNumbers({});
      } else {
        setDetectedNumbers((prev) => {
          const newNumbers = { ...prev };
          delete newNumbers[number];
          return newNumbers;
        });
      }
      setLastDetected(number);
    },
    [onNumberDetected, autoAdd],
  );

  const handleEdit = (number) => {
    setEditingNumber({ id: number, value: number });
  };

  const handleSave = () => {
    if (
      editingNumber &&
      editingNumber.value.length === 7 &&
      /^\d{7}$/.test(editingNumber.value)
    ) {
      onNumberDetected(editingNumber.value);
      if (autoAdd) {
        setDetectedNumbers({});
      }
      setLastDetected(editingNumber.value);
      setEditingNumber(null);
    }
  };

  useEffect(() => {
    if (autoAdd) {
      const sortedNumbers = Object.keys(detectedNumbers).sort(
        (a, b) => detectedNumbers[b] - detectedNumbers[a],
      );
      if (sortedNumbers.length > 0) {
        const topNumber = sortedNumbers[0];
        const topNumberCount = detectedNumbers[topNumber];
        if (topNumberCount >= 5) {
          handleAccept(topNumber);
        }
      }
    }
  }, [detectedNumbers, autoAdd, handleAccept]);

  return (
    <div className={styles.ocrContainer}>
      <div className={styles.scannerBody}>
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.video}
            style={{ display: isScanning ? "block" : "none" }}
          />
          {isScanning && roi.width > 0 && (
            <div
              ref={roiRef}
              className={styles.roi}
              style={{
                left: `${(roi.x / videoRef.current.videoWidth) * 100}%`,
                top: `${(roi.y / videoRef.current.videoHeight) * 100}%`,
                width: `${(roi.width / videoRef.current.videoWidth) * 100}%`,
                height: `${(roi.height / videoRef.current.videoHeight) * 100}%`,
                borderColor:
                  confidence > 70
                    ? "#00ff00"
                    : confidence > 40
                    ? "#ffd700"
                    : "#ff0000",
              }}
            />
          )}
          {canvasPreview && isScanning && (
            <img
              src={canvasPreview}
              className={styles.canvasPreview}
              alt="OCR Processing Preview"
            />
          )}
          {isScanning && workerReady && (
            <div className={styles.confidenceIndicator}>
              Confidence: <strong>{confidence.toFixed(2)}%</strong>
            </div>
          )}
        </div>

        <div className={styles.detectedNumbersContainer}>
          <h4>Detected Numbers:</h4>
          <div className={styles.autoAdd}>
            <input
              type="checkbox"
              id="autoAdd"
              checked={autoAdd}
              onChange={(e) => setAutoAdd(e.target.checked)}
            />
            <label htmlFor="autoAdd">Auto Add</label>
          </div>
          <ul>
            {Object.keys(detectedNumbers)
              .sort((a, b) => detectedNumbers[b] - detectedNumbers[a])
              .map((number) => (
                <li key={number}>
                  {editingNumber && editingNumber.id === number ? (
                    <div className={styles.editContainer}>
                      <input
                        type="text"
                        value={editingNumber.value}
                        onChange={(e) =>
                          setEditingNumber({
                            ...editingNumber,
                            value: e.target.value,
                          })
                        }
                        maxLength="7"
                        pattern="[0-9]{7}"
                      />
                      <button onClick={handleSave}>Save</button>
                      <button onClick={() => setEditingNumber(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className={styles.detectedItem}>
                      <span>{`${number} (${detectedNumbers[number]})`}</span>
                      <div className={styles.itemActions}>
                        <button onClick={() => handleAccept(number)}>
                          Accept
                        </button>
                        <button onClick={() => handleEdit(number)}>Edit</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
      {lastDetected && (
        <div className={styles.lastDetected}>
          <span>Last accepted:</span>
          <strong>{lastDetected}</strong>
        </div>
      )}

      {cameraError && <div className={styles.error}>{cameraError}</div>}

      <div className={styles.controls}>
        <button
          onClick={toggleScanning}
          className={`${styles.scanButton} ${
            isScanning ? styles.stop : styles.start
          }`}
          disabled={!workerReady}
        >
          {!workerReady
            ? "Initializing OCR..."
            : isScanning
            ? "Stop Scanning"
            : "Start Scanning"}
        </button>
      </div>

      <div className={styles.manualEntry}>
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Enter 7-digit number manually (e.g., 0020378)"
          maxLength="7"
          pattern="[0-9]{7}"
        />
        <button
          onClick={() => {
            if (manualInput.length === 7 && /^\d{7}$/.test(manualInput)) {
              setLastDetected(manualInput);
              onNumberDetected(manualInput);
              if (autoAdd) {
                setDetectedNumbers({});
              }
              setManualInput("");
            }
          }}
          disabled={manualInput.length !== 7 || !/^\d{7}$/.test(manualInput)}
        >
          Submit Manual Entry
        </button>
      </div>

      <div className={styles.instructions}>
        <h4>Enhanced Scanner Instructions:</h4>
        <ul>
          <li>✨ Multi-scan technology for better accuracy</li>
          <li>🎯 Adaptive image processing for Bengali numerals</li>
          <li>📊 Confidence scoring shows detection reliability</li>
          <li>🔍 Hold steady for 3 seconds per scan</li>
          <li>💡 Ensure good lighting on the prize bond</li>
          <li>📐 Keep the 7-digit number clearly visible</li>
          <li>🔢 Supports Bengali numerals: ০১২৩৪৫৬৭৮৯</li>
          <li>✅ Green border = High confidence detection</li>
          <li>⚠️ Yellow border = Low confidence (try again)</li>
          <li>❌ Red border = No number detected</li>
        </ul>
      </div>
    </div>
  );
};

export default PrizeBondOCR;
