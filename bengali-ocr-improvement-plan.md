# Bengali Prize Bond OCR Improvement Plan

## Problem Statement
Bengali numerals are being detected but incorrectly recognized (wrong digits) in the prize bond scanner.

## Technical Solutions

### 1. Enhanced Image Preprocessing
```javascript
// Improved preprocessing with adaptive thresholding
const preprocessImage = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Step 1: Convert to grayscale with better weights
  const grayscale = [];
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    grayscale.push(gray);
  }
  
  // Step 2: Apply Gaussian blur for noise reduction
  const blurred = gaussianBlur(grayscale, width, height, 1.5);
  
  // Step 3: Adaptive thresholding (better for varying lighting)
  const threshold = otsuThreshold(blurred);
  
  // Step 4: Apply morphological operations
  // - Dilation to connect broken digits
  // - Erosion to separate touching digits
  
  // Step 5: Sharpen edges for Bengali curves
  const sharpened = unsharpMask(blurred, width, height);
  
  return processedData;
};
```

### 2. Optimized Tesseract Configuration
```javascript
// Better configuration for Bengali numerals
const worker = await Tesseract.createWorker('ben', 1, {
  langPath: 'https://tessdata.projectnaptha.com/4.0.0_best', // Use best quality data
  logger: m => console.log(m) // Enable logging for debugging
});

await worker.setParameters({
  tessedit_char_whitelist: '০১২৩৪৫৬৭৮৯', // Only Bengali numerals
  tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE, // Better for single line of numbers
  tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
  tessjs_create_hocr: '0',
  tessjs_create_tsv: '0',
  tessjs_create_box: '0',
  tessjs_create_unlv: '0',
  tessjs_create_osd: '0',
  preserve_interword_spaces: '1',
  user_defined_dpi: '300', // Higher DPI for better recognition
  min_characters_to_try: '7', // Exactly 7 digits expected
});
```

### 3. Multi-Scan Averaging Algorithm
```javascript
// Scan multiple times and use consensus
const multiScanOCR = async (canvas, scanCount = 3) => {
  const results = [];
  
  for (let i = 0; i < scanCount; i++) {
    // Apply slightly different preprocessing each time
    const processed = preprocessWithVariation(canvas, i);
    const result = await worker.recognize(processed);
    
    if (result.data.confidence > 60) { // Only accept confident results
      results.push({
        text: result.data.text,
        confidence: result.data.confidence
      });
    }
  }
  
  // Find consensus among results
  return findConsensusNumber(results);
};
```

### 4. Bengali-Specific Validation
```javascript
const validateBengaliNumber = (text) => {
  // Remove any non-Bengali numerals
  const cleanText = text.replace(/[^০-৯]/g, '');
  
  // Check if exactly 7 digits
  if (cleanText.length !== 7) return null;
  
  // Bangladesh prize bonds typically start with 0
  if (!cleanText.startsWith('০')) return null;
  
  // Check for common OCR errors in Bengali
  const corrected = correctCommonErrors(cleanText);
  
  return corrected;
};

const correctCommonErrors = (text) => {
  // Common Bengali OCR confusions
  const corrections = {
    // If confidence is low, apply these rules
    // ৫ often misread as ৬
    // ১ often misread as ৯
    // ৩ often misread as ২
  };
  
  return text;
};
```

### 5. ROI (Region of Interest) Detection
```javascript
// Focus on the number region only
const detectNumberRegion = (canvas) => {
  // Use edge detection to find rectangular region
  // containing the prize bond number
  const edges = cannyEdgeDetection(canvas);
  const contours = findContours(edges);
  const numberBox = findNumberBox(contours);
  
  // Crop to just the number region
  return cropToRegion(canvas, numberBox);
};
```

### 6. Performance Optimizations
- Process lower resolution preview first for faster feedback
- Use WebWorkers for preprocessing to avoid blocking UI
- Cache successful recognitions for pattern learning
- Implement progressive enhancement (quick scan → detailed scan)

### 7. User Experience Improvements
- Show confidence score for each scan
- Highlight which digits are uncertain
- Allow manual correction with Bengali numeral keyboard
- Provide audio feedback for successful scans

## Implementation Priority
1. **High Priority** (Immediate fixes):
   - Improve preprocessing (adaptive thresholding)
   - Change PSM mode to SINGLE_LINE
   - Add confidence threshold checking

2. **Medium Priority** (Accuracy improvements):
   - Implement multi-scan averaging
   - Add Bengali-specific validation
   - Correct common OCR errors

3. **Low Priority** (Enhancements):
   - ROI detection
   - Progressive scanning
   - Pattern learning cache

## Testing Strategy
1. Create test dataset with various Bengali prize bond images
2. Test under different lighting conditions
3. Test with different fonts/printing quality
4. Measure accuracy before/after improvements
5. A/B test with users

## Expected Improvements
- Current accuracy: ~40-50% (estimated based on wrong digit issues)
- Target accuracy: >90% for clear images
- Target accuracy: >75% for average quality images