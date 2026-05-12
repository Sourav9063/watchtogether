"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { createBigTwoRoom } from "@/components/big-two/bigTwoFirebase";
import { getCustomLink, randomIdWithTimeStamp } from "@/helper/customFunc";
import { normalizeName } from "@/components/big-two/bigTwoRules";

const PLAYER_COUNTS = [1, 2, 3, 4];
const DEFAULT_MAX_POINT = 50;

export default function BigTwoHome() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetHumans, setTargetHumans] = useState(4);
  const [maxPoint, setMaxPoint] = useState(DEFAULT_MAX_POINT);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem("bigTwoPlayerName") || "");
  }, []);

  const createRoom = async (event) => {
    event.preventDefault();
    const playerName = normalizeName(name);

    if (!playerName) {
      setError("Name required.");
      return;
    }
    const pointLimit = Number(maxPoint);
    if (!Number.isFinite(pointLimit) || pointLimit < 1) {
      setError("Max point must be at least 1.");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const playerId = getCustomLink();
      const roomId = randomIdWithTimeStamp(5);
      localStorage.setItem("bigTwoPlayerName", playerName);
      await createBigTwoRoom(roomId, playerId, playerName, targetHumans, pointLimit);
      router.push(`/big-two/${roomId}`);
    } catch (err) {
      setError(err.message || "Could not create room.");
      setIsCreating(false);
    }
  };

  return (
    <main className={styles.lobbyPage}>
      <section className={styles.lobbyPanel}>
        <div>
          <p className={styles.eyebrow}>Big Two</p>
          <h1 className={styles.title}>Card table</h1>
          <p className={styles.copy}>
            Create room, share link, fill empty seats with bots.
          </p>
        </div>

        <form className={styles.form} onSubmit={createRoom}>
          <label className={styles.field}>
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={18}
              placeholder="Player name"
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend>Human seats</legend>
            <div className={styles.countGrid}>
              {PLAYER_COUNTS.map((count) => (
                <button
                  className={`${styles.countButton} ${
                    targetHumans === count ? styles.countButtonActive : ""
                  }`}
                  key={count}
                  onClick={() => setTargetHumans(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.field}>
            <span>Max point</span>
            <input
              value={maxPoint}
              min={1}
              onChange={(event) => setMaxPoint(event.target.value)}
              step={1}
              type="number"
            />
          </label>

          <div className={styles.modeNote}>
            {4 - targetHumans} bot{4 - targetHumans === 1 ? "" : "s"} fill empty seats.
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.primaryButton} disabled={isCreating} type="submit">
            {isCreating ? "Creating..." : "Create room"}
          </button>
        </form>
      </section>
    </main>
  );
}
