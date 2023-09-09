import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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

// export const dbR = getDatabase(app);
// // export const dbRef = ref(db);
// // export const dbRefChild = (child) => ref(db, child + "/");
// export const roomsRef = ref(dbR, "rooms/");
// export const getRoomRef = (roomId) => ref(dbR, "rooms/" + roomId);

// export const setRoomR = async (roomId, data) => {
//   try {
//     await set(ref(dbR, "rooms/" + roomId), data);
//   } catch (error) {
//     console.log(error);
//   }
// };
// export const setRoomActionR = async (roomId, data) => {
//   try {
//     await set(ref(dbR, "actions/" + roomId), data);
//   } catch (error) {
//     console.log(error);
//   }
// };

// export const setChatR = async (roomId, data) => {
//   try {
//     await set(ref(dbR, "chats/" + roomId), data);
//   } catch (e) {
//     console.log(e);
//   }
// };

// export const getRoomR = async (roomId) => {
//   try {
//     const roomRef = ref(dbR, "rooms/" + roomId);
//     const snapshot = await get(roomRef);
//     if (snapshot.exists()) {
//       console.log(snapshot.val());
//       return snapshot.val();
//     } else {
//       console.log("No data available");
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

export const db = getFirestore(app);
const roomsCollection = "rooms";
const actionsCollection = "actions";
const chatsCollection = "chats";

export const setRoom = async (roomId, data) => {
  try {
    await setDoc(doc(db, roomsCollection, roomId), data);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const setRoomAction = async (roomId, data) => {
  try {
    await setDoc(doc(db, actionsCollection, roomId), data);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const setChat = async (roomId, data) => {
  try {
    await setDoc(doc(db, chatsCollection, roomId), data);
  } catch (e) {
    console.log(e);
  }
};
