'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from './prizebond.module.css';

const PrizeBondOCR = dynamic(() => import('@/components/PrizeBondOCR'), {
  ssr: false,
  loading: () => <div>Loading OCR Component...</div>
});

export default function PrizeBondPage() {
  const [savedNumbers, setSavedNumbers] = useState([]);
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
      const updated = [...prev, newEntry];
      // Keep only last 100 entries
      const trimmed = updated.slice(-100);
      localStorage.setItem('prizeBondNumbers', JSON.stringify(trimmed));
      return trimmed;
    });
  };

  const handleDelete = (timestamp) => {
    setSavedNumbers(prev => {
      const updated = prev.filter(entry => entry.timestamp !== timestamp);
      localStorage.setItem('prizeBondNumbers', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEdit = (timestamp) => {
    const entryToEdit = savedNumbers.find(entry => entry.timestamp === timestamp);
    if (!entryToEdit) return;

    const newNumber = prompt('Enter new number', entryToEdit.number);
    if (newNumber && newNumber.trim()) {
      setSavedNumbers(prev => {
        const updated = prev.map(entry =>
          entry.timestamp === timestamp ? { ...entry, number: newNumber.trim() } : entry
        );
        localStorage.setItem('prizeBondNumbers', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearNumbers = () => {
    setSavedNumbers([]);
    localStorage.removeItem('prizeBondNumbers');
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
              <div>
                <button onClick={copyNumbers} className={styles.copyButton}>
                  Copy All
                </button>
                <button onClick={clearNumbers} className={styles.clearButton}>
                  Clear All
                </button>
              </div>
            </div>

            <div className={styles.numbersList}>
              {savedNumbers.length === 0 ? (
                <p className={styles.emptyState}>No numbers scanned yet</p>
              ) : (
                savedNumbers.slice().reverse().map((entry, index) => {
                  const winning = checkWinning(entry.number);
                  return (
                    <div
                      key={index}
                      className={`${styles.numberItem} ${winning ? styles.winning : ''}`}
                    >
                      <span className={styles.number}>{entry.number}</span>
                      {winning && (
                        <span className={styles.winLabel}>
                          {winning.prize} - {winning.amount}
                        </span>
                      )}
                      <span className={styles.timestamp}>
                        {new Date(entry.timestamp).toLocaleTimeString('bn-BD')}
                      </span>
                      <div className={styles.actions}>
                        <button onClick={() => handleEdit(entry.timestamp)} className={styles.editButton}>Edit</button>
                        <button onClick={() => handleDelete(entry.timestamp)} className={styles.deleteButton}>Delete</button>
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