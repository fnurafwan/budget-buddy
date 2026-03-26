// src/services/db2.ts
import { db2 } from "@/lib/firebase_lm";
import { collection, getDocs, addDoc, query, where, orderBy, limit, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"; // Tambahkan updateDoc

export interface Goal {
  id?: string;
  name: string;
  targetGram: number;
  icon: string;
  createdAt: string;
}

export interface Transaction {
  id?: string;
  goalId: string;
  date: string;
  brand: "ANTAM" | "UBS";
  weight: number;
  pricePerPiece: number;
  qty: number;
  buybackPlace: string;
  hasNPWP: boolean;
}

export interface PriceHistory {
  date: string;
  antamBuy: number;
  antamBuyback: number;
  ubsBuy: number;
  ubsBuyback: number;
}

// --- GOALS ---
export async function getGoals(): Promise<Goal[]> {
  const q = query(collection(db2, "goals"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
}

export async function addGoal(goal: Goal) {
  console.log(goal);
  return await addDoc(collection(db2, "goals"), goal);
}

// --- TRANSACTIONS ---
export async function getTransactions(goalId?: string): Promise<Transaction[]> {
  const ref = collection(db2, "transactions");
  let q;

  if (goalId) {
    q = query(ref, where("goalId", "==", goalId));
  } else {
    q = query(ref, orderBy("date", "asc"));
  }

  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));

  if (goalId) {
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return data;
}

export async function addTransaction(tx: Transaction) {
  const docRef = await addDoc(collection(db2, "transactions"), tx);
  return docRef.id; // Kembalikan ID dokumen yang baru dibuat
}

// --- FUNGSI BARU UNTUK EDIT TRANSAKSI ---
export async function updateTransaction(id: string, tx: Partial<Transaction>) {
  const docRef = doc(db2, "transactions", id);
  await updateDoc(docRef, tx);
}

// --- PRICE HISTORY (30 HARI) ---
export async function saveTodayPrice(price: Omit<PriceHistory, "date">) {
  const today = new Date().toISOString().split('T')[0]; 
  const docRef = doc(db2, "priceHistory", today);
  await setDoc(docRef, { date: today, ...price }, { merge: true }); 
}

export async function deleteTransaction(id: string) {
  const docRef = doc(db2, "transactions", id);
  await deleteDoc(docRef);
}

export async function getPriceHistory(): Promise<PriceHistory[]> {
  const q = query(collection(db2, "priceHistory"), orderBy("date", "desc"), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as PriceHistory).reverse();
}