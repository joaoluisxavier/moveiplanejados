
import React, { useState, useEffect } from 'react';
import Card from '../../Common/Card';
import Button from '../../Common/Button';
import { useAuth } from '../../../App';
import { 
    updateCurrentAdminUserPassword, 
    addMockAdminUser,
    getAllMockAdminUsers // To check for existing usernames
} from '../../../services/authService';
import { AdminUser } from '../../../types';

const AdminSettingsPage: React.FC = () => {
  const { currentAdminUser, addNotification, isLoading: authIsLoading } = useAuth();

  // State for changing own password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // State for creating new admin
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminProvisionalPassword, setNewAdminProvisionalPassword] = useState('');
  const [createAdminLoading, setCreateAdminLoading] = useState(false);

  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors";

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminUser) {
      addNotification("Nenhum administrador logado.", "error");
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      addNotification("Todos os campos de senha são obrigatórios.", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      addNotification("A nova senha e a confirmação não coincidem.", "error");
      return;
    }
    if (newPassword.length < 6) {
      addNotification("A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    setChangePasswordLoading(true);
    try {
      const result = await updateCurrentAdminUserPassword(currentAdminUser.id, currentPassword, newPassword);
      if (result.success) {
        addNotification(result.message, "success");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        addNotification(result.message, "error");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      addNotification("Erro ao tentar alterar a senha.", "error");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminUsername.trim() || !newAdminProvisionalPassword.trim()) {
      addNotification("Nome, usuário e senha provisória são obrigatórios.", "error");
      return;
    }
    if (newAdminProvisionalPassword.length < 6) {
        addNotification("A senha provisória deve ter pelo menos 6 caracteres.", "error");
        return;
    }

    setCreateAdminLoading(true);
    try {
      const existingAdmins = await getAllMockAdminUsers();
      if (existingAdmins.some(admin => admin.username === newAdminUsername.trim())) {
        addNotification("Este nome de usuário já está em uso.", "error");
        setCreateAdminLoading(false);
        return;
      }

      const newAdminData: Omit<AdminUser, 'id'> = {
        name: newAdminName.trim(),
        username: newAdminUsername.trim(),
        password: newAdminProvisionalPassword,
      };
      await addMockAdminUser(newAdminData);
      addNotification(`Administrador "${newAdminName.trim()}" criado com sucesso!`, "success");
      setNewAdminName('');
      setNewAdminUsername('');
      setNewAdminProvisionalPassword('');
    } catch (error: any) {
      console.error("Error creating new admin:", error);
      addNotification(error.message || "Erro ao criar novo administrador.", "error");
    } finally {
      setCreateAdminLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card title="Alterar Minha Senha">
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 p-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Senha Atual</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nova Senha</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={6}
              className={inputClasses}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={changePasswordLoading || authIsLoading}>
              Alterar Senha
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Criar Novo Administrador">
        <form onSubmit={handleCreateAdminSubmit} className="space-y-4 p-4">
          <div>
            <label htmlFor="newAdminName" className="block text-sm font-medium text-gray-700">Nome Completo do Novo Admin</label>
            <input
              type="text"
              id="newAdminName"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="newAdminUsername" className="block text-sm font-medium text-gray-700">Nome de Usuário (login)</label>
            <input
              type="text"
              id="newAdminUsername"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="newAdminProvisionalPassword" className="block text-sm font-medium text-gray-700">Senha Provisória</label>
            <input
              type="password"
              id="newAdminProvisionalPassword"
              value={newAdminProvisionalPassword}
              onChange={(e) => setNewAdminProvisionalPassword(e.target.value)}
              required
              minLength={6}
              className={inputClasses}
            />
             <p className="text-xs text-gray-500 mt-1">O novo administrador poderá alterar esta senha após o login.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={createAdminLoading || authIsLoading}>
              Criar Administrador
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
