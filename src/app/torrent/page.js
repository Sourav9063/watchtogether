'use client';

import styles from './page.module.css';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import FloatingNav from '@/components/stream/FloatingNav';

function TorrentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [magnetURI, setMagnetURI] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const magnet = searchParams.get('magnet');
    if (magnet) {
      setMagnetURI(magnet);
      setShowPlayer(true);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    let value = e.target.value;
    value = value.trim();
    setMagnetURI(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (magnetURI) {
      router.replace(`/torrent?magnet=${encodeURIComponent(magnetURI)}`);
      setShowPlayer(true);
    }
  };

  return (
    <div className={styles.container}>
      <FloatingNav />
      <h1>Stream Torrent</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={magnetURI}
          onChange={handleInputChange}
          placeholder="Enter Magnet URI"
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Load Stream
        </button>
      </form>

      {showPlayer && magnetURI && (
        <div>
          <DynamicWebtorPlayer magnetURI={magnetURI} />
        </div>
      )}
    </div>
  );
}

const DynamicWebtorPlayer = dynamic(() => import('../../components/WebtorPlayer'), {
  ssr: false,
  loading: () => <p>Loading Webtor player...</p>,
});

export default function TorrentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TorrentPageContent />
    </Suspense>
  );
}