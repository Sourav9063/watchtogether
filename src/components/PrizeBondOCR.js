'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import styles from './PrizeBondOCR.module.css';

const PrizeBondOCR = ({ onNumberDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const workerRef = useRef(null);
  const scanHistoryRef = useRef([]);

  const [isScanning, setIsScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [workerReady, setWorkerReady] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  // Bengali/Bangla numerals mapping
  const banglaNumerals = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9'
  };

  // Common OCR confusion patterns for Bengali numerals
  const confusionPatterns = {
    // Pattern: [likely misread, should be]
    '৫৬': ['৫', '৬'], // 5 and 6 are often confused
    '১৯': ['১', '৯'], // 1 and 9 confusion
    '৩২': ['৩', '২'], // 3 and 2 confusion
    '০৮': ['০', '৮'], // 0 and 8 confusion
  };

  // Convert Bangla numerals to English
  const convertBanglaToEnglish = (text) => {
    let converted = text;
    Object.keys(banglaNumerals).forEach(bangla => {
      converted = converted.replace(new RegExp(bangla, 'g'), banglaNumerals[bangla]);
    });
    return converted;
  };

  // Apply Otsu's thresholding algorithm
  const otsuThreshold = (grayscale, width, height) => {
    const histogram = new Array(256).fill(0);
    let total = width * height;
    
    // Calculate histogram
    for (let i = 0; i < grayscale.length; i++) {
      histogram[Math.floor(grayscale[i])]++;
    }
    
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;
    
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += i * histogram[i];
      
      let mB = sumB / wB;
      let mF = (sum - sumB) / wF;
      
      let varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = i;
      }
    }
    
    return threshold;
  };

  // Enhanced preprocessing for Bengali numerals
  const preprocessImage = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const grayscale = [];
    
    // Step 1: Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      grayscale.push(gray);
    }
    
    // Step 2: Apply simple box blur for noise reduction
    const blurred = [];
    const kernelSize = 3;
    const half = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += grayscale[ny * width + nx];
              count++;
            }
          }
        }
        
        blurred[y * width + x] = sum / count;
      }
    }
    
    // Step 3: Calculate adaptive threshold using Otsu's method
    const threshold = otsuThreshold(blurred, width, height);
    
    // Step 4: Apply threshold with slight adjustment for Bengali numerals
    // Bengali numerals often have thin strokes that need preservation
    const adjustedThreshold = Math.max(threshold - 10, 0);
    
    // Step 5: Apply thresholding and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      const value = blurred[idx] > adjustedThreshold ? 255 : 0;
      
      data[i] = value;     // Red
      data[i + 1] = value; // Green
      data[i + 2] = value; // Blue
    }
    
    return imageData;
  };

  // Apply different preprocessing variations for multi-scan
  const preprocessWithVariation = (canvas, variation) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply different preprocessing based on variation
    switch (variation) {
      case 0:
        // Standard preprocessing
        return preprocessImage(imageData);
        
      case 1:
        // Higher contrast
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const value = gray > 140 ? 255 : 0;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
        break;
        
      case 2:
        // Inverted preprocessing (white on black)
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const value = gray < 120 ? 255 : 0;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }
        break;
    }
    
    return imageData;
  };

  // Validate Bengali prize bond number
  const validateBengaliNumber = (text) => {
    // Remove any non-Bengali numerals and spaces
    const cleanText = text.replace(/[^০-৯0-9]/g, '');
    
    // Convert to English for validation
    const englishText = convertBanglaToEnglish(cleanText);
    
    // Check if exactly 7 digits
    if (englishText.length !== 7) {
      console.log(`Invalid length: ${englishText.length} digits (need 7)`);
      return null;
    }
    
    // Bangladesh prize bonds typically start with 0
    if (!englishText.startsWith('0')) {
      console.log(`Invalid format: doesn't start with 0`);
      return null;
    }
    
    // Check if all characters are digits
    if (!/^\d{7}$/.test(englishText)) {
      console.log(`Invalid characters in: ${englishText}`);
      return null;
    }
    
    return englishText;
  };

  // Find consensus among multiple scan results
  const findConsensusNumber = (results) => {
    if (results.length === 0) return null;
    
    // Count occurrences of each number
    const counts = {};
    let maxCount = 0;
    let consensus = null;
    let avgConfidence = 0;
    
    results.forEach(result => {
      if (result.number) {
        counts[result.number] = (counts[result.number] || 0) + 1;
        if (counts[result.number] > maxCount) {
          maxCount = counts[result.number];
          consensus = result.number;
        }
      }
    });
    
    // Calculate average confidence for consensus number
    if (consensus) {
      const consensusResults = results.filter(r => r.number === consensus);
      avgConfidence = consensusResults.reduce((sum, r) => sum + r.confidence, 0) / consensusResults.length;
    }
    
    // Only return if we have at least 2 matching results or high confidence
    if (maxCount >= 2 || (maxCount === 1 && avgConfidence > 80)) {
      return { number: consensus, confidence: avgConfidence, count: maxCount };
    }
    
    return null;
  };

  // Extract 7-digit numbers with improved validation
  const extractPrizeBondNumbers = (text, confidence) => {
    // Convert Bangla numerals to English first
    const convertedText = convertBanglaToEnglish(text);
    
    // Clean up the text
    const cleanText = convertedText.replace(/[\s\-\.]/g, '');
    
    // Try to find 7-digit sequences
    const regex = /\d{7}/g;
    const matches = cleanText.match(regex) || [];
    
    // Validate each match
    const validNumbers = [];
    matches.forEach(match => {
      // Additional validation for prize bond format
      if (match.startsWith('0')) {
        validNumbers.push({
          number: match,
          confidence: confidence || 0
        });
      }
    });
    
    console.log('Extracted valid numbers:', validNumbers);
    return validNumbers;
  };

  // Perform multi-scan OCR for better accuracy
  const multiScanOCR = async (canvas) => {
    const results = [];
    const scanCount = 3; // Perform 3 scans with different preprocessing
    
    for (let i = 0; i < scanCount; i++) {
      setScanProgress((i + 1) / scanCount * 100);
      
      // Apply different preprocessing for each scan
      const processedImageData = preprocessWithVariation(canvas, i);
      
      // Create a temporary canvas for processed image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(processedImageData, 0, 0);
      
      try {
        // Perform OCR
        const result = await workerRef.current.recognize(tempCanvas);
        const confidence = result.data.confidence || 0;
        
        console.log(`Scan ${i + 1} - Text: "${result.data.text}", Confidence: ${confidence}%`);
        
        // Extract numbers from this scan
        const numbers = extractPrizeBondNumbers(result.data.text, confidence);
        
        numbers.forEach(({ number, confidence: numConfidence }) => {
          const validated = validateBengaliNumber(number);
          if (validated) {
            results.push({
              number: validated,
              confidence: numConfidence || confidence,
              scanIndex: i
            });
          }
        });
        
      } catch (error) {
        console.error(`Scan ${i + 1} error:`, error);
      }
    }
    
    // Find consensus among all scans
    const consensus = findConsensusNumber(results);
    console.log('Multi-scan results:', results);
    console.log('Consensus:', consensus);
    
    return consensus;
  };

  // Initialize Tesseract worker with optimized settings
  useEffect(() => {
    const initWorker = async () => {
      try {
        console.log('Initializing Tesseract worker for Bengali with optimized settings...');
        setCameraError('Initializing Bengali OCR engine...');

        // Create worker with Bengali language
        const worker = await Tesseract.createWorker(
          'ben', // Bengali language
          1, // OEM mode (1 = LSTM_ONLY)
          {
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
            logger: m => {
              // Log progress
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );

        console.log('Worker created, setting optimized parameters for Bengali numerals...');
        
        // Optimized parameters for Bengali numeral recognition
        await worker.setParameters({
          tessedit_char_whitelist: '০১২৩৪৫৬৭৮৯', // Only Bengali numerals
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE, // Better for single line of numbers
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
          preserve_interword_spaces: '0', // No spaces in prize bond numbers
          user_defined_dpi: '300', // Higher DPI for better recognition
          tessedit_min_orientation_margin: '7.0',
          textord_min_linesize: '2.5',
          edges_max_children_per_outline: '50',
          tessedit_single_match: '0',
          tessedit_zero_rejection: '0',
          tessedit_minimal_rejection: '0',
          tessedit_write_images: '0',
          tessedit_create_hocr: '0',
          tessedit_create_tsv: '0'
        });

        workerRef.current = worker;
        setWorkerReady(true);
        setCameraError('');
        console.log('Tesseract worker initialized with optimized Bengali support');
      } catch (error) {
        console.error('Failed to initialize Tesseract:', error);
        setCameraError('Failed to initialize OCR engine: ' + error.message);
        setWorkerReady(false);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Start camera with optimal settings
  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraError('Camera access denied. Please allow camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Process frame with multi-scan and consensus
  const processFrame = useCallback(async () => {
    console.log('processFrame called', {
      video: !!videoRef.current,
      canvas: !!canvasRef.current,
      worker: !!workerRef.current,
      isProcessing
    });

    if (!videoRef.current || !canvasRef.current || !workerRef.current || isProcessing) {
      console.log('Skipping frame processing - missing requirements or already processing');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Video not ready yet');
      return;
    }

    console.log('Starting multi-scan OCR processing...');
    setIsProcessing(true);
    setScanProgress(0);

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Perform multi-scan OCR
      const consensusResult = await multiScanOCR(canvas);
      
      if (consensusResult) {
        const { number, confidence: consensusConfidence } = consensusResult;
        
        console.log(`Consensus number detected: ${number} (Confidence: ${consensusConfidence.toFixed(1)}%)`);
        setConfidence(consensusConfidence);
        
        // Only accept if different from last detected and confidence is reasonable
        if (number !== lastDetected && consensusConfidence > 50) {
          console.log('New high-confidence number detected:', number);
          setLastDetected(number);
          onNumberDetected(number);
          
          // Store in scan history for pattern learning
          scanHistoryRef.current.push({
            number,
            confidence: consensusConfidence,
            timestamp: Date.now()
          });
          
          // Visual feedback - green border for success
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 5;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          
          // Draw confidence indicator
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(`✓ ${consensusConfidence.toFixed(0)}%`, 20, 40);
        } else if (consensusConfidence > 30) {
          // Yellow border for low confidence
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          
          ctx.fillStyle = '#ffff00';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(`? ${consensusConfidence.toFixed(0)}%`, 20, 40);
        }
      } else {
        console.log('No consensus found in multi-scan');
        setConfidence(0);
        
        // Red border for no detection
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      }
    } catch (error) {
      console.error('OCR error:', error);
      setCameraError('OCR processing error: ' + error.message);
    } finally {
      setIsProcessing(false);
      setScanProgress(0);
    }
  }, [isProcessing, lastDetected, onNumberDetected]);

  // Start/stop scanning
  const toggleScanning = async () => {
    if (isScanning) {
      setIsScanning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopCamera();
      setConfidence(0);
    } else {
      setIsScanning(true);
      await startCamera();
      // Start processing frames after camera is ready
      setTimeout(() => {
        console.log('Starting frame processing...');
        processFrame(); // Process first frame immediately
        // Process frame every 3 seconds (increased for multi-scan)
        intervalRef.current = setInterval(() => {
          console.log('Processing next frame...');
          processFrame();
        }, 3000);
      }, 1000); // Give camera 1 second to initialize
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopCamera();
    };
  }, []);

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
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ display: 'none' }}
        />

        {!isScanning && (
          <div className={styles.placeholder}>
            <div className={styles.cameraIcon}>📷</div>
            <p>Click start to begin scanning</p>
          </div>
        )}

        {isScanning && isProcessing && (
          <div className={styles.processingOverlay}>
            <div className={styles.processingBar}>
              <div
                className={styles.processingProgress}
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p>Multi-scan processing... {scanProgress.toFixed(0)}%</p>
          </div>
        )}
        
        {isScanning && confidence > 0 && (
          <div className={styles.confidenceIndicator}>
            <span>Confidence: </span>
            <strong style={{ 
              color: confidence > 70 ? '#00ff00' : confidence > 50 ? '#ffff00' : '#ff9900' 
            }}>
              {confidence.toFixed(1)}%
            </strong>
          </div>
        )}
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