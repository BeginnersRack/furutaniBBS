// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth, onAuthStateChanged  } from "firebase/auth";
import { createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut ,sendEmailVerification  } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBROQ_Qz8e6TnrChFjHcjGdHzDKtRUhG1w",
  authDomain: "furutanidevelopperbbs.firebaseapp.com",
  databaseURL: "https://furutanidevelopperbbs-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "furutanidevelopperbbs",
  storageBucket: "furutanidevelopperbbs.appspot.com",
  messagingSenderId: "95095493718",
  appId: "1:95095493718:web:603f613112231b026797f7",
  measurementId: "G-6KGR8VW757"
};


//********** Initialize Firebase & import *****************
// Initialize Firebase  
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const firebaseAuth = getAuth(app);
firebaseAuth.languageCode = 'jp';


//***************************
export { firebaseAuth, onAuthStateChanged };
export { createUserWithEmailAndPassword , signInWithEmailAndPassword , signOut  ,sendEmailVerification   };

