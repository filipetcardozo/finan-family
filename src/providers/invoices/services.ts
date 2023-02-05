import { useAuth } from './../../hooks/auth/useAuth';
import { collection, getDocs, getDoc, addDoc, doc, limit, startAfter, orderBy, DocumentSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseApp, database } from "../../../firebaseConfig";
import { getAllInvoicesTypes, IInvoice } from "./types";
import dayjs from 'dayjs';

export const getAllInvoices: getAllInvoicesTypes = async () => {
  const query = await getDocs(collection(database, "invoices"));

  if (!query.empty) {
    let invoices: IInvoice[] = []

    query.forEach((doc) => {
      let invoice = doc.data();
      invoice.id = doc.id;
      invoice.addDate = dayjs(invoice.addDate)
      invoices.push(invoice as IInvoice);
    })

    return invoices;
  } else {
    return [];
  }
}

export async function putInvoice(invoice: IInvoice) {
  try {
    let newInvoice: any = { ...invoice }
    newInvoice.addDate = newInvoice.addDate?.toString()
    const docRef = await addDoc(collection(database, 'invoices'), newInvoice);
    return docRef.id;
  } catch (e) {
    return e;
  }
}