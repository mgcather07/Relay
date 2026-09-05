import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import config from '../firebase-config.json'

/* ─────────────────────────────────────────────────────────────────────────
   Firebase bootstrap. The real config is written into src/firebase-config.json
   by scripts/setup.sh (one-time per deployment). Until then the app still
   runs, but only the marketing page and the in-memory demo are available.

   Append ?emu=1 to the dev URL to point at local Auth/Firestore emulators.
   ───────────────────────────────────────────────────────────────────────── */

export const firebaseReady = !!(config.apiKey && config.projectId)

let app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

const useEmulators =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('emu') === '1'

function ensureApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(
      firebaseReady
        ? config
        : { apiKey: 'demo', projectId: 'demo-relay', appId: 'demo', authDomain: 'localhost' },
    )
  }
  return app
}

export function auth(): Auth {
  if (!_auth) {
    _auth = getAuth(ensureApp())
    if (useEmulators) connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
  return _auth
}

export function db(): Firestore {
  if (!_db) {
    _db = getFirestore(ensureApp())
    if (useEmulators) connectFirestoreEmulator(_db, '127.0.0.1', 8080)
  }
  return _db
}

/** Backend is usable when a real config is present, or when running against emulators. */
export const backendAvailable = firebaseReady || useEmulators
