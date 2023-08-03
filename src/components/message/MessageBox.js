"use client";
import { db, setChat, setRoomAction } from "@/db/dbConnection";
import { Constants } from "@/helper/CONSTANTS";
import { getCustomLink } from "@/helper/customFunc";
import { onValue, ref } from "firebase/database";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function MessageBox() {
  const searchParams = useSearchParams();

  const [showChangeName, setShowChangeName] = useState(false);

  const [message, setMessage] = useState(null);
  const [msgFrom, setMsgFrom] = useState(getCustomLink());

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
    <div>
      <h2>Messaging</h2>
      <form
        onSubmit={(e) => {
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
        }}
      >
        <h4>{`From: ${msgFrom}`}</h4>

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
            ChangeName:
          </button>
          {showChangeName && (
            <div>
              <input
                id="msgFrom"
                type="text"
                value={msgFrom}
                onBlur={() => {
                  setShowChangeName(false);
                }}
                onChange={(e) => {
                  setMsgFrom(e.target.value);
                }}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <input type="submit" value="Send" />
      </form>
    </div>
  );
}
