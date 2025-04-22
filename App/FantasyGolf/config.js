// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const FantasyGolf = {
  apiKey: "AIzaSyB3_8lQ7-uxWaXSd8K6dcBMsuh_4EJ5ZSE",
  authDomain: "fantasygolf-22bac.firebaseapp.com",
  databaseURL: "https://fantasygolf-22bac-default-rtdb.firebaseio.com",
  projectId: "fantasygolf-22bac",
  storageBucket: "fantasygolf-22bac.firebasestorage.app",
  messagingSenderId: "956483357007",
  appId: "1:956483357007:web:30ef4e0c246f616dd21d3a",
  measurementId: "G-7FR9BCNXN6"
};

const putterPicks = {
  apiKey: "AIzaSyDAcXL3niOwlLzOBOLXndRyyb8LUI9wPBY",
  authDomain: "putterpicks.firebaseapp.com",
  databaseURL: "https://putterpicks-default-rtdb.firebaseio.com",
  projectId: "putterpicks",
  storageBucket: "putterpicks.firebasestorage.app",
  messagingSenderId: "123363417489",
  appId: "1:123363417489:web:551fd069bc0a6fbbaace30",
  measurementId: "G-S55CJWKC0R"
};

// Initialize Firebase
const app = initializeApp(putterPicks);
const analytics = getAnalytics(app);