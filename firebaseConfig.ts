import { FirebaseOptions, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_REACT_APP_API_KEY,
    projectId: process.env.NEXT_PUBLIC_REACT_APP_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGIN_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_REACT_APP_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_REACT_APP_MEASUREMENT_ID,
    authDomain: process.env.NEXT_PUBLIC_REACT_APP_AUTH_DOMAIN
}

export const firebaseApp = initializeApp(firebaseConfig)
export const database = getFirestore(firebaseApp)