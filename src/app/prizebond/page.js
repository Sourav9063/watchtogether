'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import styles from './prizebond.module.css';

const PrizeBondOCR = dynamic(() => import('@/components/PrizeBondOCR'), {
  ssr: false,
  loading: () => <div>Loading OCR Component...</div>
});

export default function PrizeBondPage() {
  const [savedNumbers, setSavedNumbers] = useState([]);
  const [showCheckButtons, setShowCheckButtons] = useState(false);
  const [winningNumbers, setWinningNumbers] = useState({
    first: '0544222',
    second: ['0241768'],
    third: ['0553845', '0964052'],
    fourth: ['0054382', '0197142']
  });

  useEffect(() => {
    // Load saved numbers from localStorage
    const stored = localStorage.getItem('prizeBondNumbers');
    if (stored) {
      setSavedNumbers(JSON.parse(stored));
    }
  }, []);

  const handleNumberDetected = (number) => {
    const timestamp = new Date().toISOString();
    const newEntry = { number, timestamp };

    setSavedNumbers(prev => {
      const exist = prev.find(entry => entry.number === number);
      if (exist) {
        return prev;
      }

      let updated = [...prev, newEntry].sort((a, b) => a.number - b.number);
      localStorage.setItem('prizeBondNumbers', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDelete = (number) => {
    setSavedNumbers(prev => {
      const updated = prev.filter(entry => entry.number !== number);
      localStorage.setItem('prizeBondNumbers', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEdit = (number) => {
    const entryToEdit = savedNumbers.find(entry => entry.number === number);
    if (!entryToEdit) return;

    const newNumber = prompt('Enter new number', entryToEdit.number);
    if (newNumber && newNumber.trim()) {
      setSavedNumbers(prev => {
        const updated = prev.map(entry =>
          entry.number === number ? { ...entry, number: newNumber.trim() } : entry
        );
        localStorage.setItem('prizeBondNumbers', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearNumbers = () => {
    if (window.confirm('Are you sure you want to delete all saved numbers?')) {
      setSavedNumbers([]);
      localStorage.removeItem('prizeBondNumbers');
    }
  };

  const copyNumbers = () => {
    const numbersToCopy = savedNumbers.map(entry => entry.number).join('\n');
    navigator.clipboard.writeText(numbersToCopy)
      .then(() => {
        alert('All numbers copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy numbers: ', err);
        alert('Failed to copy numbers. Please try again.');
      });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(savedNumbers.map(entry => ({ Number: entry.number })), { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prize Bonds');
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    XLSX.writeFile(wb, `prizebond-backup-${dateTime}.xlsx`);

    setTimeout(() => {
      window.open('https://prizebond.ird.gov.bd/MultipleNumbers.php', '_blank');
    }, 1000);
  };

  const handleCheck = (chunkIndex) => {
    const chunkSize = 100;
    const start = chunkIndex * chunkSize;
    const end = start + chunkSize;
    const chunk = savedNumbers.slice(start, end);

    if (chunk.length === 0) {
      alert('No numbers in this range.');
      return;
    }

    const paddedNumbers = chunk.map(entry => String(entry.number).padStart(7, '0'));
    const numbersToCheck = paddedNumbers.join(',');
    const url = `https://www.bb.org.bd/en/index.php/investfacility/prizebond?gsearch=${encodeURIComponent(numbersToCheck)}`;
    window.open(url, '_blank');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const newNumbers = json.flat().map(String).filter(num => num.trim().length > 0);

      setSavedNumbers(prev => {
        const existingNumbers = new Set(prev.map(entry => entry.number));
        const uniqueNewEntries = newNumbers
          .filter(number => !existingNumbers.has(number))
          .map(number => ({ number, timestamp: new Date().toISOString() }));

        const updated = [...prev, ...uniqueNewEntries];
        localStorage.setItem('prizeBondNumbers', JSON.stringify(updated));
        alert(`${uniqueNewEntries.length} new numbers imported.`);
        return updated;
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; // Reset file input
  };

  const checkWinning = (number) => {
    if (number === winningNumbers.first) return { prize: 'First Prize', amount: '৳6,00,000' };
    if (winningNumbers.second.includes(number)) return { prize: 'Second Prize', amount: '৳3,25,000' };
    if (winningNumbers.third.includes(number)) return { prize: 'Third Prize', amount: '৳1,00,000' };
    if (winningNumbers.fourth.includes(number)) return { prize: 'Fourth Prize', amount: '৳50,000' };
    return null;
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
              <h3>Scanned Numbers ({savedNumbers.length})</h3>
              <div className={styles.buttonGroup}>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button onClick={exportToExcel} className={styles.exportButton}>
                    Export
                  </button>
                  <label className={styles.importButton}>
                    Import
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <button onClick={copyNumbers} className={styles.copyButton}>
                  Copy All
                </button>
                <button onClick={clearNumbers} className={styles.clearButton}>
                  Clear All
                </button>
                {!showCheckButtons ? (
                  <button onClick={() => setShowCheckButtons(true)} className={styles.exportButton}>
                    Check
                  </button>
                ) : (
                  Array.from({ length: Math.ceil(savedNumbers.length / 100) }).map((_, index) => {
                    const start = index * 100 + 1;
                    const end = Math.min((index + 1) * 100, savedNumbers.length);
                    return (
                      <button key={index} onClick={() => handleCheck(index)} className={styles.exportButton}>
                        Check ({start} - {end})
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.numbersList}>
              {savedNumbers.length === 0 ? (
                <p className={styles.emptyState}>No numbers scanned yet</p>
              ) : (
                savedNumbers.reverse().map((entry, index) => {
                  const winning = checkWinning(entry.number);
                  return (
                    <div
                      key={index}
                      className={`${styles.numberItem} ${winning ? styles.winning : ''}`}
                    >
                      <span className={styles.number}>{entry.number?.padStart(7, '0')}</span>
                      {winning && (
                        <span className={styles.winLabel}>
                          {winning.prize} - {winning.amount}
                        </span>
                      )}
                      <div className={styles.actions}>
                        <button onClick={() => handleEdit(entry.number)} className={styles.editButton}>Edit</button>
                        <button onClick={() => handleDelete(entry.number)} className={styles.deleteButton}>Delete</button>
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