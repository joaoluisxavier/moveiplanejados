import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
import { auth, db } from './services/firebase';

import LoginPage from './components/Auth/LoginPage';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './components/Dashboard/DashboardPage';
import FurnitureTrackingPage from './components/Furniture/FurnitureTrackingPage';
import FurnitureDetailPage from './components/Furniture/FurnitureDetailPage';
import DeadlinesPage from './components/Deadlines/DeadlinesPage';
import AssistancePage from './components/Assistance/AssistancePage';
import MessagesPage from './components/Communication/MessagesPage';
import PurchasedItemsPage from './components/Items/PurchasedItemsPage';
import ContractPage from './components/Contract/ContractPage';

import AdminLoginPage from './components/Admin/Auth/AdminLoginPage';
import AdminLayout from './components/Admin/Layout/AdminLayout';
import AdminDashboardPage from './components/Admin/Dashboard/AdminDashboardPage';
import AdminClientsListPage from './components/Admin/Clients/AdminClientsListPage';
import AdminClientDetailPage from './components/Admin/Clients/AdminClientDetailPage';
import AdminFurnitureManagementPage from './components/Admin/Furniture/AdminFurnitureManagementPage';
import AdminAssistanceManagementPage from './components/Admin/Assistance/AdminAssistanceManagementPage';
import AdminMessagesManagementPage from './components/Admin/Communication/AdminMessagesManagementPage';
import AdminPurchasedItemsManagementPage from './components/Admin/Sales/AdminPurchasedItemsManagementPage';
import AdminContractManagementPage from './components/Admin/Sales/AdminContractManagementPage';
import AdminDeadlinesManagementPage from './components/Admin/Sales/AdminDeadlinesManagementPage';
import AdminClientFormPage from './components/Admin/Clients/AdminClientFormPage';
import AdminSettingsPage from './components/Admin/Settings/AdminSettingsPage';
import AdminAllAssistanceRequestsPage from './components/Admin/Assistance/AdminAllAssistanceRequestsPage'; 

import { User, AdminUser, AppNotification } from './types';
import { login, logout, adminLogin } from './services/authService';
import NotificationContainer from './components/Common/NotificationContainer';

interface AuthContextType {
  currentUser: User | null;
  currentAdminUser: AdminUser | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  adminLogin: (username: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;
  isLoading: boolean; // Combined loading state
  addNotification: (message: string, type: AppNotification['type']) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Global loading for initial auth check from Firebase
  const [authLoading, setAuthLoading] = useState(false); // Specific for login button presses
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Firebase onAuthStateChanged triggered. User:", firebaseUser?.uid);
      if (firebaseUser) {
        const usersCollection = collection(db, 'users');
        const userDocRef = doc(usersCollection, firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.isAdmin) {
            const admin: AdminUser = {
              id: firebaseUser.uid,
              username: userData.username,
              name: userData.name,
            };
            setCurrentAdminUser(admin);
            setCurrentUser(null);
            console.log("Admin user authenticated:", admin);
          } else {
            const client: User = {
              id: firebaseUser.uid,
              username: userData.username,
              name: userData.name,
              email: userData.email,
            };
            setCurrentUser(client);
            setCurrentAdminUser(null);
            console.log("Client user authenticated:", client);
          }
        } else {
          console.warn(`User document not found in Firestore for UID: ${firebaseUser.uid}. Logging out.`);
          await logout();
        }
      } else {
        setCurrentUser(null);
        setCurrentAdminUser(null);
        console.log("No user signed in.");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addNotification = useCallback((message: string, type: AppNotification['type']) => {
    const newNotification: AppNotification = { id: Date.now().toString(), message, type };
    setNotifications(prev => [newNotification, ...prev].slice(0, 5)); // Keep last 5
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const handleLogin = useCallback(async (username: string, pass: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      // Login function now expects email, not username for login. We use the username field as email.
      const success = await login(username, pass);
      if (success) {
        addNotification('Login bem-sucedido!', 'success');
        navigate('/');
        return true;
      } else {
        addNotification('Usuário ou senha inválidos.', 'error');
        return false;
      }
    } catch (error: any) {
      addNotification(error.message || 'Erro ao tentar fazer login.', 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate, addNotification]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    addNotification('Logout realizado com sucesso.', 'info');
    navigate('/login');
  }, [navigate, addNotification]);

  const handleAdminLogin = useCallback(async (username: string, pass: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
       // Admin login now expects an email. We construct it from the username.
      const adminEmail = `${username}@admin.local`;
      const success = await adminLogin(adminEmail, pass);
      if (success) {
        addNotification('Login de administrador bem-sucedido!', 'success');
        navigate('/admin/dashboard');
        return true;
      } else {
        addNotification('Usuário ou senha de administrador inválidos.', 'error');
        return false;
      }
    } catch (error: any) {
      addNotification(error.message || 'Erro ao tentar fazer login como administrador.', 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate, addNotification]);

  const handleAdminLogout = useCallback(async (): Promise<void> => {
    await logout();
    addNotification('Logout de administrador realizado com sucesso.', 'info');
    navigate('/admin/login');
  }, [navigate, addNotification]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-sky-700">Carregando Portal...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
        currentUser, 
        currentAdminUser, 
        login: handleLogin, 
        logout: handleLogout, 
        adminLogin: handleAdminLogin, 
        adminLogout: handleAdminLogout, 
        isLoading: authLoading, // Use authLoading for button states
        addNotification 
    }}>
      <NotificationContainer notifications={notifications} />
      <Routes>
        {/* Client Routes */}
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
        <Route 
          path="/*" 
          element={
            currentUser ? (
              <MainLayout>
                <Routes>
                  <Route index element={<DashboardPage />} />
                  <Route path="meus-moveis" element={<FurnitureTrackingPage />} />
                  <Route path="meus-moveis/:itemId" element={<FurnitureDetailPage />} />
                  <Route path="prazos" element={<DeadlinesPage />} />
                  <Route path="assistencia" element={<AssistancePage />} />
                  <Route path="mensagens" element={<MessagesPage />} />
                  <Route path="itens-comprados" element={<PurchasedItemsPage />} />
                  <Route path="contrato" element={<ContractPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </MainLayout>
            ) : (
              !window.location.hash.startsWith('#/admin') && !currentAdminUser ? <Navigate to="/login" replace /> : null
            )
          } 
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={currentAdminUser ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage />} />
        <Route 
          path="/admin/*"
          element={
            currentAdminUser ? (
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="clients" element={<AdminClientsListPage />} />
                  <Route path="clients/new" element={<AdminClientFormPage />} />
                  <Route path="clients/:clientId/edit" element={<AdminClientFormPage />} />
                  <Route path="clients/:clientId" element={<AdminClientDetailPage />} />
                  <Route path="clients/:clientId/furniture" element={<AdminFurnitureManagementPage />} />
                  <Route path="clients/:clientId/assistance" element={<AdminAssistanceManagementPage />} />
                  <Route path="clients/:clientId/messages" element={<AdminMessagesManagementPage />} />
                  <Route path="clients/:clientId/items" element={<AdminPurchasedItemsManagementPage />} />
                  <Route path="clients/:clientId/contract" element={<AdminContractManagementPage />} />
                  <Route path="clients/:clientId/deadlines" element={<AdminDeadlinesManagementPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="assistance-all" element={<AdminAllAssistanceRequestsPage />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                </Routes>
              </AdminLayout>
            ) : (
              window.location.hash.startsWith('#/admin') ? <Navigate to="/admin/login" replace /> : null
            )
          }
        />
         {/* Fallback for any route not matched */}
        {!currentUser && !currentAdminUser && !window.location.hash.startsWith('#/admin') && (
            <Route path="*" element={<Navigate to="/login" replace />} />
        )}
         {!currentUser && !currentAdminUser && window.location.hash.startsWith('#/admin') && (
             <Route path="*" element={<Navigate to="/admin/login" replace />} />
        )}

      </Routes>
    </AuthContext.Provider>
  );
};

export default App;
