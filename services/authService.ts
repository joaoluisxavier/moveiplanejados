import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, AdminUser } from '../types';
import { auth, db } from './firebase';

// Helper to convert Firebase error codes to user-friendly messages
const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'O formato do email fornecido é inválido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Usuário ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este email já está sendo utilizado por outra conta.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    case 'auth/requires-recent-login':
      return 'Esta operação requer um login recente. Por favor, faça login novamente e tente de novo.';
    default:
      return 'Ocorreu um erro de autenticação. Tente novamente.';
  }
};


// --- AUTHENTICATION FUNCTIONS ---

export const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user) {
        throw new Error("Falha no login, usuário não encontrado.");
    }
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && !userDoc.data()?.isAdmin) {
      // The onAuthStateChanged listener in App.tsx will handle setting the user state.
      return true;
    } else {
      // User is an admin or doesn't exist in Firestore
      await signOut(auth);
      throw new Error("Credenciais inválidas ou conta de administrador.");
    }
  } catch (error: any) {
    console.error("Login failed:", error.code, error.message);
    throw new Error(getFirebaseAuthErrorMessage(error.code));
  }
};

export const adminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user) {
        throw new Error("Falha no login de admin, usuário não encontrado.");
    }
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data()?.isAdmin === true) {
      return true;
    } else {
      await signOut(auth);
      throw new Error("Acesso negado. Esta conta não é de administrador.");
    }
  } catch (error: any) {
    console.error("Admin Login failed:", error.code, error.message);
    throw new Error(getFirebaseAuthErrorMessage(error.code));
  }
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// --- USER MANAGEMENT (Admin actions) ---

export const getAllClients = async (): Promise<User[]> => {
  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef, where("isAdmin", "!=", true));
  const querySnapshot = await getDocs(q);
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      id: doc.id,
      name: data.name,
      username: data.username,
      email: data.email,
    });
  });
  return users;
};

export const getClientById = async (userId: string): Promise<User | null> => {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const data = userDoc.data();
    if (data) {
        return {
          id: userDoc.id,
          name: data.name,
          username: data.username,
          email: data.email,
        };
    }
  }
  return null;
};

export const addClient = async (userData: Omit<User, 'id'>): Promise<User> => {
   if (!userData.password) {
    throw new Error("A senha é obrigatória para criar um novo usuário.");
  }
  
  // Temporarily sign out admin if needed, or handle this via a Cloud Function in a real-world scenario.
  // For this project, we assume we can create users directly.
  // A better approach is using the Admin SDK on a backend.
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const { user } = userCredential;
    if (!user) {
        throw new Error("Falha ao criar usuário na autenticação.");
    }

    const newUserDoc: Omit<User, 'id' | 'password'> & { isAdmin: boolean } = {
      name: userData.name,
      username: userData.username,
      email: userData.email,
      isAdmin: false,
    };
    await setDoc(doc(db, 'users', user.uid), newUserDoc);
    
    // The current logged-in user changes after createUserWithEmailAndPassword.
    // In a real app, this should be an admin-only operation via backend to not affect admin's session.
    // For now, we'll accept this behavior.

    return { id: user.uid, ...userData };
  } catch (error: any) {
    console.error("Error adding user:", error.code, error.message);
    throw new Error(getFirebaseAuthErrorMessage(error.code));
  }
};


export const updateClient = async (userId: string, userData: Partial<User>): Promise<User | null> => {
  const userDocRef = doc(db, "users", userId);
  const updates: Partial<User> = { ...userData };
  delete updates.password; // Password must be updated separately via Admin SDK.
  
  await updateDoc(userDocRef, updates);

  if (userData.password) {
    console.warn("A senha de outro usuário não pode ser alterada diretamente pelo client-side SDK. Esta operação deve ser feita por uma Cloud Function com privilégios de administrador.");
  }

  return getClientById(userId);
};

export const deleteClientFirestoreRecord = async (userId: string): Promise<boolean> => {
  try {
    console.warn(`DELETING USER: For production, user deletion should be a backend process. Deleting only Firestore record for user ${userId}.`);
    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);
    return true;
  } catch (error) {
    console.error("Error deleting user Firestore record:", error);
    return false;
  }
};


// --- ADMIN USER MANAGEMENT ---

export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
   const usersCollectionRef = collection(db, 'users');
   const q = query(usersCollectionRef, where("isAdmin", "==", true));
   const querySnapshot = await getDocs(q);
   const admins: AdminUser[] = [];
   querySnapshot.forEach((doc) => {
     const data = doc.data();
     admins.push({
       id: doc.id,
       name: data.name,
       username: data.username,
     });
   });
   return admins;
};

export const addAdminUser = async (adminData: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
   if (!adminData.password) {
    throw new Error("A senha é obrigatória para criar um novo administrador.");
  }
  // This has the same issue as addClient - it will log the current user out.
  // Best handled via backend.
  try {
    // We use a dummy email format for admins as Firebase Auth is email-based.
    const adminEmail = `${adminData.username}@admin.local`;
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminData.password);
    const { user } = userCredential;

    if (!user) {
        throw new Error("Falha ao criar usuário admin na autenticação.");
    }

    const newAdmin = {
      name: adminData.name,
      username: adminData.username,
      email: adminEmail,
      isAdmin: true,
    };
    await setDoc(doc(db, 'users', user.uid), newAdmin);
    
    return { id: user.uid, ...adminData };
  } catch (error: any) {
    throw new Error(getFirebaseAuthErrorMessage(error.code));
  }
};

export const updateCurrentAdminUserPassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const user = auth.currentUser;
  if (user && user.email) {
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { success: true, message: "Senha alterada com sucesso." };
    } catch (error: any) {
      console.error("Password update error:", error);
      return { success: false, message: getFirebaseAuthErrorMessage(error.code) };
    }
  }
  return { success: false, message: "Usuário não autenticado corretamente." };
};
