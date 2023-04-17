import { useAuth } from '../../hooks/useAuth';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, startAfter, orderBy, DocumentSnapshot, deleteDoc } from "firebase/firestore";
import { query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseApp, database } from "../../../firebaseConfig";
import { deleteInvoiceTypes, getAllInvoicesTypes, getInvoiceTypes, getUserInvoicesTypes, IInvoice, updateInvoiceTypes } from "./types";
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

export const getUserInvoices: getUserInvoicesTypes = async (uid: string, dateToAnalyze: string) => {
  const collectionRef = collection(database, 'invoices');
  const getQuery = query(collectionRef, where('userId', '==', uid), where('addDateFormatted', '==', dateToAnalyze));
  // const getQuery = query(collectionRef, where('userId', '==', uid), where('addMonth', '==', 1));
  const data = await getDocs(getQuery)

  if (!data.empty) {
    let invoices: IInvoice[] = []

    data.forEach((doc) => {
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

export const getInvoice: getInvoiceTypes = async (invoiceId: string) => {
  const docRef = doc(database, 'invoices', invoiceId);
  const data = await getDoc(docRef);

  if (data.exists()) {
    let invoice = data.data();
    invoice.id = data.id;
    invoice.addDate = dayjs(invoice.addDate);

    return invoice as IInvoice;
  } else {
    return null;
  }
}

export const updateInvoice: updateInvoiceTypes = async (invoice: IInvoice) => {
  let newInvoice: any = { ...invoice }
  newInvoice.addDate = newInvoice.addDate?.toString()
  const docRef = doc(database, 'invoices', newInvoice.id);
  await updateDoc(docRef, newInvoice);
}

export const deleteInvoice: deleteInvoiceTypes = async (invoiceId: string) => {
  await deleteDoc(doc(database, "invoices", invoiceId));
}


export async function putInvoice(invoice: IInvoice) {
  let newInvoice: any = { ...invoice }
  newInvoice.addDate = newInvoice.addDate?.toString()
  const docRef = await addDoc(collection(database, 'invoices'), newInvoice);
  return {
    ...invoice, id: docRef.id
  };
}