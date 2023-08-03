"use client";
import { dbR, setChat, setRoomAction } from "@/db/dbConnection";
import { Constants } from "@/helper/CONSTANTS";
import { getCustomLink } from "@/helper/customFunc";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function MessageBox() {
  const searchParams = useSearchParams();

  const [showChangeName, setShowChangeName] = useState(false);

  const [message, setMessage] = useState("");
  const [msgFrom, setMsgFrom] = useState("");
  useEffect(() => {
    setMsgFrom(getCustomLink());
    return () => {};
  }, []);

  // useEffect(() => {
  //   const roomId = searchParams.get("room") || getCustomLink();

  //   const chatRef = ref(db, "chats/" + roomId);
  //   return onValue(chatRef, (snapshot) => {
  //     const data = snapshot.val();
  //     if (snapshot.exists()) {
  //       if (data.from === getCustomLink()) {
  //         return;
  //       }
  //     }
  //   });
  // }, []);

  return (
    <div className="message">
      <h2>Messaging</h2>
      <div>{`From: ${msgFrom}`}</div>

      <div>
        <button
          style={{
            padding: ".5rem",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowChangeName(!showChangeName);
          }}
        >
          Change Name
        </button>
        {showChangeName && (
          <div>
            <input
              id="msgFrom"
              type="text"
              value={msgFrom}
              onChange={(e) => {
                setMsgFrom(e.target.value);
              }}
            />
          </div>
        )}
      </div>

      <form action="">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <input
          type="submit"
          value="Send"
          onClick={(e) => {
            e.preventDefault();
            if (!message) {
              return;
            }
            const roomId = searchParams.get("room") || getCustomLink();
            setRoomAction(roomId, {
              type: Constants.playerActions.CHAT,
              by: getCustomLink(),
              name: msgFrom,
              message: message,
            });
            setMessage("");
            setShowChangeName(false);
          }}
        />
      </form>
    </div>
  );
}
