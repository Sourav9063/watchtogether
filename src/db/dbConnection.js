import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_appId,
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
// export const dbRef = ref(db);
// export const dbRefChild = (child) => ref(db, child + "/");
export const roomsRef = ref(db, "rooms/");
export const getRoomRef = (roomId) => ref(db, "rooms/" + roomId);

export const setRoom = async (roomId, data) => {
  try {
    await set(ref(db, "rooms/" + roomId), data);
  } catch (error) {
    console.log(error);
  }
};
export const setRoomAction = async (roomId, data) => {
  try {
    await set(ref(db, "actions/" + roomId), data);
  } catch (error) {
    console.log(error);
  }
};

export const setChat = async (roomId, data) => {
  try {
    await set(ref(db, "chats/" + roomId), data);
  } catch (e) {
    console.log(e);
  }
};

export const getRoom = async (roomId) => {
  try {
    const roomRef = ref(db, "rooms/" + roomId);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      console.log(snapshot.val());
      return snapshot.val();
    } else {
      console.log("No data available");
    }
  } catch (error) {
    console.log(error);
  }
};
