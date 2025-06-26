
import { User, AdminUser } from '../types';

const MOCK_USERS_STORAGE_KEY = 'mockClientUsersData';
const MOCK_ADMIN_USERS_STORAGE_KEY = 'mockAdminUsersData';

// Initial default users (clients)
const defaultMockUsers: User[] = [
  { id: '1', username: 'cliente1', name: 'João Silva', email: 'joao.silva@example.com', password: 'senha123' },
  { id: '2', username: 'cliente2', name: 'Maria Oliveira', email: 'maria.oliveira@example.com', password: 'senha123' },
];

let mockUsers: User[];

try {
  const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
  if (storedUsers) {
    const parsedUsers = JSON.parse(storedUsers);
    if (Array.isArray(parsedUsers) && (parsedUsers.length === 0 || (parsedUsers.length > 0 && typeof parsedUsers[0]?.id !== 'undefined'))) {
        mockUsers = parsedUsers;
        console.log(`authService: Successfully loaded ${mockUsers.length} users from localStorage for key ${MOCK_USERS_STORAGE_KEY}.`);
    } else {
        console.warn(`authService: Stored data for key ${MOCK_USERS_STORAGE_KEY} is invalid. Falling back to defaults and overwriting localStorage.`);
        mockUsers = [...defaultMockUsers];
        localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    }
  } else {
    console.log(`authService: No data found for key ${MOCK_USERS_STORAGE_KEY}. Initializing with default users and saving to localStorage.`);
    mockUsers = [...defaultMockUsers];
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  }
} catch (error) {
  console.error(`authService: Error loading/parsing localStorage for key ${MOCK_USERS_STORAGE_KEY}:`, error, `. Falling back to default and overwriting.`);
  mockUsers = [...defaultMockUsers];
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
}

const saveMockUsersToLocalStorage = () => {
  try {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    console.log(`authService: Saved ${mockUsers.length} users to localStorage for key ${MOCK_USERS_STORAGE_KEY}.`);
  } catch (error) {
    console.error(`authService: Error saving mockUsers to localStorage (key ${MOCK_USERS_STORAGE_KEY}):`, error);
  }
};

// Admin users management with localStorage
let mockAdminUsers: AdminUser[];
const defaultAdminUser: AdminUser = { id: 'admin1', username: 'admin', name: 'Administrador Principal', password: 'adminpass' };

try {
  const storedAdminUsers = localStorage.getItem(MOCK_ADMIN_USERS_STORAGE_KEY);
  if (storedAdminUsers) {
    const parsedAdminUsers = JSON.parse(storedAdminUsers);
    if (Array.isArray(parsedAdminUsers) && 
        (parsedAdminUsers.length === 0 || 
         (parsedAdminUsers.length > 0 && 
          typeof parsedAdminUsers[0]?.id !== 'undefined' && 
          typeof parsedAdminUsers[0]?.password !== 'undefined'))) {
        mockAdminUsers = parsedAdminUsers;
        console.log(`authService: Successfully loaded ${mockAdminUsers.length} admin users from localStorage for key ${MOCK_ADMIN_USERS_STORAGE_KEY}.`);
    } else {
        console.warn(`authService: Stored data for key ${MOCK_ADMIN_USERS_STORAGE_KEY} is invalid. Falling back to default and overwriting localStorage.`);
        mockAdminUsers = [defaultAdminUser];
        localStorage.setItem(MOCK_ADMIN_USERS_STORAGE_KEY, JSON.stringify(mockAdminUsers));
    }
  } else {
    console.log(`authService: No data found for key ${MOCK_ADMIN_USERS_STORAGE_KEY}. Initializing with default admin user and saving to localStorage.`);
    mockAdminUsers = [defaultAdminUser];
    localStorage.setItem(MOCK_ADMIN_USERS_STORAGE_KEY, JSON.stringify(mockAdminUsers));
  }
} catch (error) {
  console.error(`authService: Error loading/parsing localStorage for key ${MOCK_ADMIN_USERS_STORAGE_KEY}:`, error, `. Falling back to default and overwriting.`);
  mockAdminUsers = [defaultAdminUser];
  localStorage.setItem(MOCK_ADMIN_USERS_STORAGE_KEY, JSON.stringify(mockAdminUsers));
}

const saveMockAdminUsersToLocalStorage = () => {
  try {
    localStorage.setItem(MOCK_ADMIN_USERS_STORAGE_KEY, JSON.stringify(mockAdminUsers));
     console.log(`authService: Saved ${mockAdminUsers.length} admin users to localStorage for key ${MOCK_ADMIN_USERS_STORAGE_KEY}.`);
  } catch (error)
 {
    console.error(`authService: Error saving mockAdminUsers to localStorage (key ${MOCK_ADMIN_USERS_STORAGE_KEY}):`, error);
  }
};


export const mockLogin = (username: string, password: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.username === username && u.password === password);
      resolve(user || null);
    }, 200); 
  });
};

export const mockLogout = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
};

export const mockAdminLogin = (username: string, password: string): Promise<AdminUser | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const adminUser = mockAdminUsers.find(u => u.username === username && u.password === password);
      resolve(adminUser || null);
    }, 200);
  });
};

export const getAllMockUsers = (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockUsers]); // Return a copy
    }, 100);
  });
};

export const getMockUserById = (userId: string): Promise<User | null> => {
   return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUsers.find(u => u.id === userId) || null);
    }, 100);
  });
};

export const addMockUser = (userData: Omit<User, 'id'>): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...userData,
        password: userData.password || 'senha123', // Default password if not provided
      };
      mockUsers.push(newUser);
      saveMockUsersToLocalStorage();
      resolve(newUser);
    }, 200);
  });
};

export const updateMockUser = (userId: string, userData: Partial<User>): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      if (userIndex > -1) {
        // Ensure password is only updated if explicitly provided and not empty
        const newPassword = userData.password && userData.password.trim() !== '' ? userData.password : mockUsers[userIndex].password;
        mockUsers[userIndex] = { 
            ...mockUsers[userIndex], 
            ...userData,
            password: newPassword // Use the determined password
        };
        saveMockUsersToLocalStorage();
        resolve(mockUsers[userIndex]);
      } else {
        resolve(null);
      }
    }, 200);
  });
};

export const deleteMockUser = (userId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initialLength = mockUsers.length;
      mockUsers = mockUsers.filter(u => u.id !== userId);
      if (mockUsers.length < initialLength) {
        saveMockUsersToLocalStorage();
        resolve(true);
      } else {
        resolve(false);
      }
    }, 200);
  });
};

// Admin User Management Functions
export const getAllMockAdminUsers = (): Promise<AdminUser[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockAdminUsers]); // Return a copy
    }, 100);
  });
};

export const addMockAdminUser = (adminData: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockAdminUsers.find(u => u.username === adminData.username)) {
        reject(new Error('Admin username already exists.'));
        return;
      }
      if (!adminData.password || adminData.password.trim() === '') {
        reject(new Error('Password is required for new admin users.'));
        return;
      }
      const newAdmin: AdminUser = {
        id: `admin-${Date.now()}`,
        name: adminData.name,
        username: adminData.username,
        password: adminData.password, // Password is required
      };
      mockAdminUsers.push(newAdmin);
      saveMockAdminUsersToLocalStorage();
      resolve(newAdmin);
    }, 200);
  });
};

export const updateCurrentAdminUserPassword = (adminId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const adminIndex = mockAdminUsers.findIndex(u => u.id === adminId);
      if (adminIndex === -1) {
        resolve({ success: false, message: 'Administrador não encontrado.' });
        return;
      }
      if (mockAdminUsers[adminIndex].password !== oldPassword) {
        resolve({ success: false, message: 'Senha atual incorreta.' });
        return;
      }
      if (!newPassword || newPassword.trim() === '') {
        resolve({ success: false, message: 'Nova senha não pode ser vazia.' });
        return;
      }
      mockAdminUsers[adminIndex].password = newPassword;
      saveMockAdminUsersToLocalStorage();
      resolve({ success: true, message: 'Senha alterada com sucesso.' });
    }, 200);
  });
};
