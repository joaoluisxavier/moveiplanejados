import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  writeBatch,
  orderBy,
  setDoc,
  DocumentData,
  Query,
  Firestore,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  User, 
  FurnitureItem, 
  AssistanceRequest,
  AssistanceRequestStatus,
  Message,
  PurchasedItem,
  ContractDetails,
  Deadline,
  ManufacturingLogEntry,
  FurnitureStatus
} from '../types';
import { getClientById } from './authService';

// Helper function to convert a Firestore snapshot to a typed object
const fromSnapshot = <T extends {id: string}>(docSnap: DocumentSnapshot<DocumentData>): T | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  // Firestore timestamps need to be converted to string for our app's type
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = new Date(data[key].toDate()).toISOString();
    }
  });
  return { id: docSnap.id, ...data } as T;
}

const fromQuerySnapshot = <T extends {id: string}>(querySnap: QueryDocumentSnapshot<DocumentData>): T => {
  const data = querySnap.data();
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = new Date(data[key].toDate()).toISOString();
    }
  });
  return { id: querySnap.id, ...data } as T;
}

// --- Recalculate Contract Total ---
const recalculateAndUpdateContractTotal = async (userId: string) => {
  const items = await getPurchasedItems(userId);
  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const contractRef = doc(db, 'contracts', userId);
  await setDoc(contractRef, { totalValue }, { merge: true });
};

// --- Furniture ---
export const getFurnitureItems = async (userId: string): Promise<FurnitureItem[]> => {
  const q = query(collection(db, 'furniture'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => fromQuerySnapshot<FurnitureItem>(doc));
};

export const getFurnitureItemDetails = async (itemId: string, userId:string): Promise<FurnitureItem | null> => {
    const itemRef = doc(db, 'furniture', itemId);
    const itemSnap = await getDoc(itemRef);
    const item = fromSnapshot<FurnitureItem>(itemSnap);
    // Security check: ensure the item belongs to the user requesting it
    if (item && item.userId === userId) {
        return item;
    }
    return null;
};

// --- Deadlines ---
export const getDeadlines = async (userId: string): Promise<Deadline[]> => {
  const q = query(collection(db, 'deadlines'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => fromQuerySnapshot<Deadline>(doc));
};

// --- Assistance ---
export const getAssistanceRequests = async (userId: string): Promise<AssistanceRequest[]> => {
  const q = query(collection(db, 'assistanceRequests'), where('userId', '==', userId), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => fromQuerySnapshot<AssistanceRequest>(doc));
};

export const submitAssistanceRequest = async (userId: string, requestData: Omit<AssistanceRequest, 'id' | 'date' | 'status' | 'userId'>): Promise<AssistanceRequest> => {
  const newRequest = {
    ...requestData,
    userId,
    date: new Date().toLocaleDateString('pt-BR'),
    status: AssistanceRequestStatus.Aberto,
  };
  const docRef = await addDoc(collection(db, 'assistanceRequests'), newRequest);
  return { id: docRef.id, ...newRequest };
};

// --- Communication ---
export const getMessages = async (userId: string): Promise<Message[]> => {
  const q = query(collection(db, 'messages'), where('userId', '==', userId), orderBy('timestamp'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => fromQuerySnapshot<Message>(doc));
};

export const sendMessage = async (userId: string, content: string, sender: 'cliente' | 'empresa' | 'admin'): Promise<Message> => {
  const newMessage = {
    userId,
    sender,
    content,
    timestamp: Timestamp.now(),
    read: false,
  };
  const docRef = await addDoc(collection(db, 'messages'), newMessage);
  return { id: docRef.id, ...fromSnapshot<Message>(await getDoc(docRef))! };
};

// --- Items ---
export const getPurchasedItems = async (userId: string): Promise<PurchasedItem[]> => {
  const q = query(collection(db, 'purchasedItems'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => fromQuerySnapshot<PurchasedItem>(doc));
};

// --- Contract ---
export const getContractDetails = async (userId: string): Promise<ContractDetails | null> => {
  const contractRef = doc(db, 'contracts', userId);
  const contractSnap = await getDoc(contractRef);
  return fromSnapshot<ContractDetails>(contractSnap);
};

// --- ADMIN FUNCTIONS ---

// Furniture
export const adminGetFurnitureItemsByUserId = getFurnitureItems;

export const adminGetAllFurnitureItems = async (): Promise<FurnitureItem[]> => {
  const querySnapshot = await getDocs(collection(db, 'furniture'));
  return querySnapshot.docs.map(doc => fromQuerySnapshot<FurnitureItem>(doc));
};

export const adminGetFurnitureItemDetails = async (itemId: string): Promise<FurnitureItem | null> => {
    const itemRef = doc(db, 'furniture', itemId);
    const itemSnap = await getDoc(itemRef);
    return fromSnapshot<FurnitureItem>(itemSnap);
};

export const adminAddFurnitureItem = async (userId: string, itemData: Omit<FurnitureItem, 'id'|'userId'|'manufacturingLog'>): Promise<FurnitureItem> => {
    const newLogEntry: ManufacturingLogEntry = {
        stage: itemData.status,
        date: new Date().toLocaleDateString('pt-BR'),
        notes: 'Item cadastrado no sistema.'
    };
    const newItem = {
        ...itemData,
        userId,
        manufacturingLog: [newLogEntry]
    };
    const docRef = await addDoc(collection(db, 'furniture'), newItem);
    return { id: docRef.id, ...newItem };
};

export const adminUpdateFurnitureItem = async (itemId: string, updates: Partial<FurnitureItem>): Promise<FurnitureItem | null> => {
    const itemRef = doc(db, 'furniture', itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) return null;

    const currentData = itemSnap.data() as FurnitureItem;
    // If status has changed, add a new log entry
    if (updates.status && updates.status !== currentData.status) {
        const newLogEntry: ManufacturingLogEntry = {
            stage: updates.status,
            date: new Date().toLocaleDateString('pt-BR'),
            notes: `Status alterado de ${currentData.status} para ${updates.status}.`
        };
        updates.manufacturingLog = [...(currentData.manufacturingLog || []), newLogEntry];
    }

    await updateDoc(itemRef, updates);
    return await adminGetFurnitureItemDetails(itemId);
};

export const adminDeleteFurnitureItem = async (itemId: string): Promise<boolean> => {
    await deleteDoc(doc(db, 'furniture', itemId));
    return true;
};

// Assistance
export const adminGetAssistanceRequestsByUserId = getAssistanceRequests;

export const adminGetAllAssistanceRequests = async (): Promise<AssistanceRequest[]> => {
    const querySnapshot = await getDocs(collection(db, 'assistanceRequests'));
    return querySnapshot.docs.map(doc => fromQuerySnapshot<AssistanceRequest>(doc));
};

export const adminUpdateAssistanceRequest = async (requestId: string, updates: Partial<AssistanceRequest>): Promise<AssistanceRequest | null> => {
    const reqRef = doc(db, 'assistanceRequests', requestId);
    await updateDoc(reqRef, updates);
    const reqSnap = await getDoc(reqRef);
    return fromSnapshot<AssistanceRequest>(reqSnap);
};

// Messages
export const adminGetMessagesByUserId = getMessages;
export const adminSendMessage = (userId: string, content: string) => sendMessage(userId, content, 'admin');

// Purchased Items
export const adminGetPurchasedItemsByUserId = getPurchasedItems;

export const adminAddPurchasedItem = async (userId: string, itemData: Omit<PurchasedItem, 'id'|'userId'|'totalPrice'>): Promise<PurchasedItem> => {
    const newItem = {
        ...itemData,
        userId,
        totalPrice: itemData.quantity * itemData.unitPrice
    };
    const docRef = await addDoc(collection(db, 'purchasedItems'), newItem);
    await recalculateAndUpdateContractTotal(userId);
    return { id: docRef.id, ...newItem };
};

export const adminUpdatePurchasedItem = async (itemId: string, updates: Partial<PurchasedItem>): Promise<PurchasedItem | null> => {
    const itemRef = doc(db, 'purchasedItems', itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) return null;

    const currentData = itemSnap.data() as PurchasedItem;
    const newQuantity = updates.quantity ?? currentData.quantity;
    const newUnitPrice = updates.unitPrice ?? currentData.unitPrice;

    updates.totalPrice = newQuantity * newUnitPrice;

    await updateDoc(itemRef, updates);
    await recalculateAndUpdateContractTotal(currentData.userId);
    const updatedSnap = await getDoc(itemRef);
    return fromSnapshot<PurchasedItem>(updatedSnap);
};

export const adminDeletePurchasedItem = async (itemId: string): Promise<boolean> => {
    const itemRef = doc(db, 'purchasedItems', itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const userId = itemSnap.data().userId;
      await deleteDoc(itemRef);
      await recalculateAndUpdateContractTotal(userId);
      return true;
    }
    return false;
};

// Contract
export const adminGetContractDetailsByUserId = getContractDetails;

export const adminUpdateContractDetails = async (userId: string, details: Partial<Omit<ContractDetails, 'userId'|'clientName'>>): Promise<ContractDetails | null> => {
  const contractRef = doc(db, 'contracts', userId);
  const client = await getClientById(userId);
  if (!client) throw new Error("Client not found for contract update");

  const fullDetails = {
    ...details,
    userId,
    clientName: client.name,
  };

  await setDoc(contractRef, fullDetails, { merge: true });
  return await getContractDetails(userId);
};


// Deadlines
export const adminGetDeadlinesByUserId = getDeadlines;

export const adminAddDeadline = async (userId: string, deadlineData: Omit<Deadline, 'id'|'userId'>): Promise<Deadline> => {
  const newDeadline = { ...deadlineData, userId };
  const docRef = await addDoc(collection(db, 'deadlines'), newDeadline);
  return { id: docRef.id, ...newDeadline };
};

export const adminUpdateDeadline = async (deadlineId: string, updates: Partial<Deadline>): Promise<Deadline | null> => {
  const deadlineRef = doc(db, 'deadlines', deadlineId);
  await updateDoc(deadlineRef, updates);
  const deadlineSnap = await getDoc(deadlineRef);
  return fromSnapshot<Deadline>(deadlineSnap);
};

export const adminDeleteDeadline = async (deadlineId: string): Promise<boolean> => {
  await deleteDoc(doc(db, 'deadlines', deadlineId));
  return true;
};

// Client Management (re-export from authService)
export { 
    getAllClients as adminGetAllClients, 
    getClientById as adminGetClientById,
    addClient as adminAddClient,
    updateClient as adminUpdateClient,
} from './authService';

import { deleteClientFirestoreRecord } from './authService';

const deleteCollectionForUser = async (db: Firestore, collectionName: string, userId: string) => {
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.size === 0) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Deleted ${snapshot.size} documents from ${collectionName} for user ${userId}`);
};

export const adminDeleteClient = async (userId: string): Promise<boolean> => {
    console.log(`dataService: Attempting to delete client ${userId} and all associated data.`);
    
    // Batch delete all associated data
    await Promise.all([
        deleteCollectionForUser(db, 'furniture', userId),
        deleteCollectionForUser(db, 'deadlines', userId),
        deleteCollectionForUser(db, 'assistanceRequests', userId),
        deleteCollectionForUser(db, 'messages', userId),
        deleteCollectionForUser(db, 'purchasedItems', userId),
        deleteDoc(doc(db, 'contracts', userId)),
    ]);
    
    // Delete the user record from the 'users' collection
    const userDeleted = await deleteClientFirestoreRecord(userId); 

    if (userDeleted) {
        console.log(`dataService: Firestore data for user ${userId} deleted. The Auth record must be deleted manually from the Firebase Console or via a backend function.`);
        return true;
    }
    
    console.log(`dataService: Client ${userId} not found or not deleted. No data cleaned.`);
    return false;
};