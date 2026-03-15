import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCDe02wb0FLDXM-wB-T2qoF5fMWmCAEu_E",
  authDomain: "cozy-dc90a.firebaseapp.com",
  projectId: "cozy-dc90a",
  storageBucket: "cozy-dc90a.firebasestorage.app",
  messagingSenderId: "424823899435",
  appId: "1:424823899435:web:2876428b358d6e261bb16e",
  measurementId: "G-9TQBCP6889"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});
