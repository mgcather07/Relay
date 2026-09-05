import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, backendAvailable } from './lib/firebase'
import {
  defaultOrgSettings,
  makeInviteCode,
  sampleTickets,
  ROLE_LABEL,
  type MemberDoc,
  type OrgDoc,
  type Role,
  type UserDoc,
} from './lib/model'

/* ─────────────────────────────────────────────────────────────────────────
   Session — who is signed in, which workspace they belong to, and the
   account/workspace actions. Renders one of four app states:

     landing     signed out (marketing page + sign in)
     onboarding  signed in, not in a workspace yet (create or join)
     ready       signed in + workspace loaded → the real product
     demo        the in-memory sample workspace, no account needed
   ───────────────────────────────────────────────────────────────────────── */

export interface SessionMember extends MemberDoc {
  uid: string
}

export interface Session {
  status: 'loading' | 'landing' | 'onboarding' | 'ready' | 'demo'
  backendAvailable: boolean
  user: User | null
  orgId: string | null
  org: OrgDoc | null
  members: SessionMember[]
  me: SessionMember | null
  enterDemo: () => void
  exitDemo: () => void
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOutUser: () => Promise<void>
  createOrg: (companyName: string) => Promise<void>
  joinOrg: (code: string) => Promise<void>
}

const Ctx = createContext<Session | null>(null)
export const useSession = () => useContext(Ctx)!

export function friendlyAuthError(e: any): string {
  const code = String(e?.code || '')
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'That email and password don’t match an account.'
  if (code.includes('email-already-in-use')) return 'An account already exists for that email — sign in instead.'
  if (code.includes('weak-password')) return 'Password needs at least 6 characters.'
  if (code.includes('invalid-email')) return 'That doesn’t look like a valid email address.'
  if (code.includes('too-many-requests')) return 'Too many attempts — wait a minute and try again.'
  if (code.includes('network-request-failed')) return 'Can’t reach the server — check your connection.'
  if (code.includes('configuration-not-found') || code.includes('operation-not-allowed'))
    return 'This deployment isn’t activated yet (email sign-in is disabled in Firebase).'
  return e?.message || 'Something went wrong — try again.'
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authSettled, setAuthSettled] = useState(!backendAvailable)
  const [userDocLoaded, setUserDocLoaded] = useState(false)
  const [org, setOrg] = useState<OrgDoc | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [members, setMembers] = useState<SessionMember[]>([])
  const [demo, setDemo] = useState(false)

  /* Auth state */
  useEffect(() => {
    if (!backendAvailable) return
    return onAuthStateChanged(auth(), (u) => {
      setUser(u)
      setAuthSettled(true)
      if (!u) {
        setUserDocLoaded(false)
        setOrg(null)
        setOrgId(null)
        setMembers([])
      }
    })
  }, [])

  /* users/{uid} → which org */
  useEffect(() => {
    if (!user) return
    setUserDocLoaded(false)
    return onSnapshot(doc(db(), 'users', user.uid), (snap) => {
      const d = (snap.data() as UserDoc | undefined) || null
      setOrgId(d?.orgId || null)
      setUserDocLoaded(true)
    })
  }, [user])

  /* org + members */
  useEffect(() => {
    if (!orgId) {
      setOrg(null)
      setMembers([])
      return
    }
    const un1 = onSnapshot(doc(db(), 'orgs', orgId), (snap) => setOrg((snap.data() as OrgDoc) || null))
    const un2 = onSnapshot(collection(db(), 'orgs', orgId, 'members'), (snap) =>
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as MemberDoc) }))),
    )
    return () => {
      un1()
      un2()
    }
  }, [orgId])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth(), email.trim(), password)
    await updateProfile(cred.user, { displayName: name.trim() })
    await setDoc(doc(db(), 'users', cred.user.uid), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      orgId: null,
    } satisfies UserDoc)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth(), email.trim(), password)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth(), email.trim())
  }, [])

  const signOutUser = useCallback(async () => {
    await signOut(auth())
  }, [])

  const createOrg = useCallback(async (companyName: string) => {
    const u = auth().currentUser
    if (!u) throw new Error('Not signed in')
    const name = companyName.trim()
    if (!name) throw new Error('Give your workspace a name.')
    const displayName = u.displayName || u.email || 'Founder'
    const domain = (u.email || '').split('@')[1] || 'example.com'
    const newOrgRef = doc(collection(db(), 'orgs'))
    const invites = { agent: makeInviteCode('agent'), requester: makeInviteCode('requester') }
    const orgDoc: OrgDoc = {
      name,
      ownerUid: u.uid,
      createdAt: Date.now(),
      prefix: 'RLY',
      seq: 1003, // sample tickets take 1000–1002
      invites,
      settings: defaultOrgSettings(name, domain),
    }
    // Order matters for security rules: org (founder) → member (admin) → the rest.
    await setDoc(newOrgRef, orgDoc)
    await setDoc(doc(db(), 'orgs', newOrgRef.id, 'members', u.uid), {
      name: displayName,
      email: (u.email || '').toLowerCase(),
      role: 'admin',
      team: 'Helpdesk',
      joinedAt: Date.now(),
    } satisfies MemberDoc)
    const batch = writeBatch(db())
    batch.set(doc(db(), 'invites', invites.agent), { orgId: newOrgRef.id, orgName: name, role: 'agent', createdAt: Date.now() })
    batch.set(doc(db(), 'invites', invites.requester), { orgId: newOrgRef.id, orgName: name, role: 'requester', createdAt: Date.now() })
    for (const t of sampleTickets('RLY', 1000, displayName)) {
      const { id, ...rest } = t
      batch.set(doc(db(), 'orgs', newOrgRef.id, 'tickets', id), { id, ...rest })
    }
    batch.set(doc(db(), 'users', u.uid), { name: displayName, email: (u.email || '').toLowerCase(), orgId: newOrgRef.id } satisfies UserDoc)
    await batch.commit()
  }, [])

  const joinOrg = useCallback(async (rawCode: string) => {
    const u = auth().currentUser
    if (!u) throw new Error('Not signed in')
    const code = rawCode.trim().toUpperCase()
    if (!code) throw new Error('Enter the invite code from your administrator.')
    const inviteSnap = await getDoc(doc(db(), 'invites', code))
    if (!inviteSnap.exists()) throw new Error('That invite code isn’t valid — check it with your administrator.')
    const invite = inviteSnap.data() as { orgId: string; orgName: string; role: Role }
    const displayName = u.displayName || u.email || 'Member'
    await setDoc(doc(db(), 'orgs', invite.orgId, 'members', u.uid), {
      name: displayName,
      email: (u.email || '').toLowerCase(),
      role: invite.role,
      team: 'Helpdesk',
      joinedAt: Date.now(),
      inviteCode: code,
    } satisfies MemberDoc)
    await setDoc(doc(db(), 'users', u.uid), {
      name: displayName,
      email: (u.email || '').toLowerCase(),
      orgId: invite.orgId,
    } satisfies UserDoc)
  }, [])

  const me = (user && members.find((m) => m.uid === user.uid)) || null

  let status: Session['status']
  if (demo) status = 'demo'
  else if (!authSettled) status = 'loading'
  else if (!user) status = 'landing'
  else if (!userDocLoaded) status = 'loading'
  else if (!orgId) status = 'onboarding'
  else if (org && me) status = 'ready'
  else status = 'loading'

  const session: Session = {
    status,
    backendAvailable,
    user: user as Session['user'],
    orgId,
    org,
    members,
    me,
    enterDemo: () => setDemo(true),
    exitDemo: () => setDemo(false),
    signUp,
    signIn,
    resetPassword,
    signOutUser,
    createOrg,
    joinOrg,
  }

  return <Ctx.Provider value={session}>{children}</Ctx.Provider>
}

export function roleTitle(m: { role: Role; team: string } | null): string {
  if (!m) return ''
  if (m.role === 'admin') return m.team + ' · ' + ROLE_LABEL.admin
  if (m.role === 'agent') return m.team + ' · ' + ROLE_LABEL.agent
  return ROLE_LABEL.requester
}
