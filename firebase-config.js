/* =========================================================================
  FIREBASE SETUP powers the shared, permanent scoreboard
   =========================================================================
   The scoreboard needs somewhere to store scores that EVERY visitor can see,
   not just the person currently on the page. Firebase Firestore's free tier
   is the easiest way to do this for a self-hosted static site.

   SETUP (about 10 minutes, no credit card required):
   1. Go to https://console.firebase.google.com and create a new project
      (call it something like "msnd-showcase").
   2. In the project, click the "</>" (web app) icon to register a new web app.
  3. Firebase will show you a config object like the one below, copy your
      real values into the firebaseConfig object here.
   4. In the left sidebar, go to Build > Firestore Database > Create database.
      Start in "test mode" for the showcase (or set rules below).
  5. That's it, script.js will handle reading/writing scores automatically.

   RECOMMENDED FIRESTORE RULES (Firestore > Rules tab), so anyone can post a
   score but no one can edit or delete someone else's:
   -------------------------------------------------------------------------
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /scores/{scoreId} {
         allow read: if true;
         allow create: if request.resource.data.name is string
                       && request.resource.data.name.size() <= 24
                       && request.resource.data.score is int
                       && request.resource.data.score >= 0
                       && request.resource.data.score <= 999;
         allow update, delete: if false;
       }
     }
   }
   -------------------------------------------------------------------------
   ========================================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: replace with YOUR project's config from the Firebase console.
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase not configured yet, scoreboard will run in local-only fallback mode.", err);
}

const LOCAL_KEY = "msnd_scoreboard_fallback";

function localFallbackSave(name, score) {
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  list.push({ name, score, ts: Date.now() });
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function localFallbackLoad() {
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  return list.sort((a, b) => b.score - a.score).slice(0, 10);
}

export async function saveScore(name, score) {
  if (!db) {
    localFallbackSave(name, score);
    return { local: true };
  }
  try {
    await addDoc(collection(db, "scores"), {
      name: name.slice(0, 24),
      score,
      createdAt: serverTimestamp(),
    });
    return { local: false };
  } catch (err) {
    console.error("Failed to save score to Firestore, falling back to local.", err);
    localFallbackSave(name, score);
    return { local: true, error: err };
  }
}

export async function loadTopScores() {
  if (!db) {
    return { scores: localFallbackLoad(), local: true };
  }
  try {
    const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));
    const snap = await getDocs(q);
    const scores = snap.docs.map((d) => d.data());
    return { scores, local: false };
  } catch (err) {
    console.error("Failed to load scores from Firestore, falling back to local.", err);
    return { scores: localFallbackLoad(), local: true, error: err };
  }
}

export const isFirebaseConfigured = !!db;
