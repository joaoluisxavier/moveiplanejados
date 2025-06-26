import React, { useState } from 'react';
import { useAuth } from '../../../App';
import Button from '../../Common/Button';
import { ADMIN_APP_NAME } from '../../../constants';
import { Link } from 'react-router-dom'; // Import Link

const BuildingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.75M9 12h6.75m-6.75 5.25h6.75M5.25 6h.008v.008H5.25V6zm.75 0h.008v.008H6V6zm.75 0h.008v.008H6.75V6zm.75 0h.008v.008H7.5V6zm0 5.25h.008v.008H7.5v-.008zm-.75 0h.008v.008H6.75v-.008zm-.75 0h.008v.008H6v-.008zm-.75 0h.008v.008H5.25v-.008zm13.5 0h.008v.008h-.008v-.008zm-.75 0h.008v.008h-.008v-.008zm-.75 0h.008v.008h-.008v-.008zm-.75 0h.008v.008h-.008v-.008zm0-5.25h.008v.008h-.008v-.008zm-.75 0h.008v.008h-.008v-.008zm-.75 0h.008v.008h-.008v-.008zm-.75 0h.008v.008h-.008v-.008z" />
  </svg>
);


const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { adminLogin, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // The adminLogin function in context expects the username, and it will construct the email
    const success = await adminLogin(username, password);
    if (!success && !isLoading) {
        setError('Usuário ou senha de administrador inválidos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <BuildingIcon className="w-16 h-16 mx-auto text-sky-600 mb-3" />
          <h1 className="text-3xl font-bold text-gray-800">{ADMIN_APP_NAME}</h1>
          <p className="text-gray-600 mt-2">Acesso Restrito</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700">
              Usuário Admin
            </label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="admin.user"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
              Senha Admin
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="********"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full bg-slate-700 hover:bg-slate-800 focus:ring-slate-500">
              {isLoading ? 'Entrando...' : 'Entrar como Admin'}
            </Button>
          </div>
        </form>
        <div className="mt-8 text-center border-t pt-6 border-gray-200">
            <Link to="/login" className="text-sm font-medium text-sky-700 hover:text-sky-500 hover:underline">
                Acessar Portal do Cliente
            </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;