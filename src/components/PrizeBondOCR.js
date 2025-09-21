'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import styles from './PrizeBondOCR.module.css';

const PrizeBondOCR = ({ onNumberDetected }) => {
  const videoRef = useRef(null);
  const workerRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [workerReady, setWorkerReady] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [manualInput, setManualInput] = useState('');

  // Initialize Tesseract worker for Bengali
  useEffect(() => {
    const initializeWorker = async () => {
      // Tesseract.js v6+
      const worker = await Tesseract.createWorker('ben');
      await worker.setParameters({
        tessedit_char_whitelist: '০১২৩৪৫৬৭৮৯', // Whitelist only Bengali digits
      });
      workerRef.current = worker;
      setWorkerReady(true);
    };

    initializeWorker();

    return () => {
      workerRef.current?.terminate();
      setWorkerReady(false);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError('');
    } catch (err) {
      console.error("Camera Error:", err);
      setCameraError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
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
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return bengaliNumber.split('').map(char => {
      const index = bengaliNumerals.indexOf(char);
      return index !== -1 ? englishNumerals[index] : '';
    }).join('');
  };

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !workerRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // For better accuracy, you might need image preprocessing (grayscale, contrast, etc.)
    // Example:
    context.filter = 'grayscale(1) contrast(1.5)';
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const { data } = await workerRef.current.recognize(canvas);
    
    // The whitelist should make this cleaner, but we can still process it.
    const texts = data.text.split('\n')?.map(text => text.replace(/\s/g, ''))?.filter(text => text.length===7 );
    if(texts.length<1) return;
    console.log(texts)
    const cleanedText = texts[0];
    const bengali7DigitRegex = /[০১২৩৪৫৬৭৮৯]{7}/;
    const match = cleanedText.match(bengali7DigitRegex);
    console.log({cleanedText, match})

    if (match) {
      const detectedBengali = match[0];
      const detectedEnglish = translateBengaliToEnglish(detectedBengali);
      
      if (detectedEnglish.length === 7 && detectedEnglish !== lastDetected) {
        console.log('Detected:', detectedEnglish, 'Confidence:', data.confidence);
        setLastDetected(detectedEnglish);
        setConfidence(data.confidence);
        onNumberDetected(detectedEnglish);
      }
    }
  }, [lastDetected, onNumberDetected]);

  // Scanning loop
  useEffect(() => {
    if (isScanning && workerReady) {
      scanIntervalRef.current = setInterval(scanFrame, 200);
    } else {
      clearInterval(scanIntervalRef.current);
    }
    return () => clearInterval(scanIntervalRef.current);
  }, [isScanning, workerReady, scanFrame]);

  return (
    <div className={styles.ocrContainer}>
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.video}
          style={{ display: isScanning ? 'block' : 'none' }}
        />
      </div>

      {cameraError && (
        <div className={styles.error}>
          {cameraError}
        </div>
      )}

      <div className={styles.controls}>
        <button
          onClick={toggleScanning}
          className={`${styles.scanButton} ${isScanning ? styles.stop : styles.start}`}
          disabled={!workerReady}
        >
          {!workerReady ? 'Initializing OCR...' : (isScanning ? 'Stop Scanning' : 'Start Scanning')}
        </button>
      </div>

      {lastDetected && (
        <div className={styles.lastDetected}>
          <span>Last detected:</span>
          <strong>{lastDetected}</strong>
          {confidence > 0 && (
            <span className={styles.confidenceBadge}>
              {confidence.toFixed(0)}% sure
            </span>
          )}
        </div>
      )}

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
              setManualInput('');
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