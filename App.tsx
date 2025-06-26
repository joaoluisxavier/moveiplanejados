
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// --- LocalStorage Availability Check ---
try {
  const testKey = '__test_ls_availability__';
  localStorage.setItem(testKey, 'test');
  if (localStorage.getItem(testKey) !== 'test') {
    throw new Error('LocalStorage value integrity check failed.');
  }
  localStorage.removeItem(testKey);
  console.info('LocalStorage is available and writable.');
} catch (e) {
  console.error("CRITICAL: LocalStorage is not available, not writable, or value integrity check failed. Data persistence will not work.", e);
  // alert("Erro Crítico: O armazenamento local não está disponível ou não funciona corretamente. O aplicativo pode não salvar seus dados. Por favor, verifique as configurações do seu navegador (например, modo de navegação privada ou extensões) ou tente um navegador diferente.");
}
// --- End LocalStorage Check ---

import LoginPage from './components/Auth/LoginPage';
import MainLayout from './components/Layout/MainLayout';
import DashboardPage from './components/Dashboard/DashboardPage';
import FurnitureTrackingPage from './components/Furniture/FurnitureTrackingPage';
import FurnitureDetailPage from './components/Furniture/FurnitureDetailPage';
import DeadlinesPage from './components/Deadlines/DeadlinesPage';
import AssistancePage from './components/Assistance/AssistancePage';
// import DeliverySchedulingPage from './components/Delivery/DeliverySchedulingPage'; // Removido
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
import AdminAllAssistanceRequestsPage from './components/Admin/Assistance/AdminAllAssistanceRequestsPage'; // Novo Import


import { User, AdminUser, AppNotification } from './types';
import { mockLogin, mockLogout, mockAdminLogin } from './services/authService';
import NotificationContainer from './components/Common/NotificationContainer';

interface AuthContextType {
  currentUser: User | null;
  currentAdminUser: AdminUser | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  adminLogin: (username: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Global loading for initial auth check
  const [authLoading, setAuthLoading] = useState<boolean>(false); // Specific for login processes
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("App.tsx: Attempting to load user sessions from localStorage.");
    const savedUser = localStorage.getItem('currentUser');
    const savedAdminUser = localStorage.getItem('currentAdminUser');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Enhanced validation for User object
        if (parsedUser && typeof parsedUser.id === 'string' && typeof parsedUser.username === 'string' && typeof parsedUser.name === 'string') {
          setCurrentUser(parsedUser as User);
          console.log("App.tsx: Successfully loaded and validated 'currentUser' from localStorage:", parsedUser);
        } else {
          console.warn("App.tsx: Parsed 'currentUser' from localStorage is not a valid User object. Removing invalid item.", parsedUser);
          localStorage.removeItem('currentUser');
        }
      } catch (e) {
        console.error("App.tsx: Failed to parse 'currentUser' from localStorage. Removing invalid item.", e);
        localStorage.removeItem('currentUser');
      }
    } else {
        console.log("App.tsx: No 'currentUser' found in localStorage.");
    }

    if (savedAdminUser) {
      try {
        const parsedAdminUser = JSON.parse(savedAdminUser);
        // Enhanced validation for AdminUser object
        if (parsedAdminUser && typeof parsedAdminUser.id === 'string' && typeof parsedAdminUser.username === 'string' && typeof parsedAdminUser.name === 'string') {
          setCurrentAdminUser(parsedAdminUser as AdminUser);
          console.log("App.tsx: Successfully loaded and validated 'currentAdminUser' from localStorage:", parsedAdminUser);
        } else {
          console.warn("App.tsx: Parsed 'currentAdminUser' from localStorage is not a valid AdminUser object. Removing invalid item.", parsedAdminUser);
          localStorage.removeItem('currentAdminUser');
        }
      } catch (e) {
        console.error("App.tsx: Failed to parse 'currentAdminUser' from localStorage. Removing invalid item.", e);
        localStorage.removeItem('currentAdminUser');
      }
    } else {
        console.log("App.tsx: No 'currentAdminUser' found in localStorage.");
    }
    setIsLoading(false);
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
      const user = await mockLogin(username, pass);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log("App.tsx: 'currentUser' saved to localStorage after login:", user);
        addNotification('Login bem-sucedido!', 'success');
        navigate('/');
        return true;
      } else {
        addNotification('Usuário ou senha inválidos.', 'error');
        return false;
      }
    } catch (error) {
      addNotification('Erro ao tentar fazer login.', 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate, addNotification]);

  const handleLogout = useCallback((): void => {
    mockLogout();
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    console.log("App.tsx: 'currentUser' removed from localStorage after logout.");
    addNotification('Logout realizado com sucesso.', 'info');
    navigate('/login');
  }, [navigate, addNotification]);

  const handleAdminLogin = useCallback(async (username: string, pass: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const adminUser = await mockAdminLogin(username, pass);
      if (adminUser) {
        setCurrentAdminUser(adminUser);
        localStorage.setItem('currentAdminUser', JSON.stringify(adminUser));
        console.log("App.tsx: 'currentAdminUser' saved to localStorage after admin login:", adminUser);
        addNotification('Login de administrador bem-sucedido!', 'success');
        navigate('/admin/dashboard');
        return true;
      } else {
        addNotification('Usuário ou senha de administrador inválidos.', 'error');
        return false;
      }
    } catch (error) {
      addNotification('Erro ao tentar fazer login como administrador.', 'error');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [navigate, addNotification]);

  const handleAdminLogout = useCallback((): void => {
    mockLogout(); // Assuming same logout process for simplicity
    setCurrentAdminUser(null);
    localStorage.removeItem('currentAdminUser');
    console.log("App.tsx: 'currentAdminUser' removed from localStorage after admin logout.");
    addNotification('Logout de administrador realizado com sucesso.', 'info');
    navigate('/admin/login');
  }, [navigate, addNotification]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-sky-700">Loading Portal...</div>
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
        isLoading: authLoading, // Use authLoading for button states etc.
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
                  {/* <Route path="agendar-entrega" element={<DeliverySchedulingPage />} /> Removido */}
                  <Route path="mensagens" element={<MessagesPage />} />
                  <Route path="itens-comprados" element={<PurchasedItemsPage />} />
                  <Route path="contrato" element={<ContractPage />} />
                  <Route path="*" element={<Navigate to="/" />} /> {/* Default client route to dashboard */}
                </Routes>
              </MainLayout>
            ) : (
              // If not logged in as client, and not an admin route, redirect to client login
              // Check if the current hash path starts with #/admin
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
                  <Route path="assistance-all" element={<AdminAllAssistanceRequestsPage />} /> {/* Nova Rota */}
                  <Route path="*" element={<Navigate to="/admin/dashboard" />} /> {/* Default admin route */}
                </Routes>
              </AdminLayout>
            ) : (
              // If not logged in as admin, redirect to admin login
              window.location.hash.startsWith('#/admin') ? <Navigate to="/admin/login" replace /> : null
            )
          }
        />
         {/* Fallback for any route not matched, if no user and not admin, go to client login */}
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
