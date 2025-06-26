import React, { useState } from 'react';
import { useAuth } from '../../App';
import Button from '../Common/Button';
import { APP_NAME } from '../../constants';
import { Link } from 'react-router-dom'; // Import Link

// Simple furniture icon
const FurnitureIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 12h3M10.5 16.5h3M4.5 4.5h15a2.25 2.25 0 012.25 2.25v1.5A2.25 2.25 0 0119.5 10.5h-15A2.25 2.25 0 012.25 8.25v-1.5A2.25 2.25 0 014.5 4.5z" />
  </svg>
);


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState(''); // Changed from username to email for clarity
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // The login function in context expects email for login
    const success = await login(email, password);
    if (!success && !isLoading) { // isLoading check prevents showing error during loading
        setError('Usuário ou senha inválidos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 to-indigo-700 p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:scale-105 duration-300">
        <div className="text-center mb-8">
          <FurnitureIcon className="w-16 h-16 mx-auto text-sky-600 mb-3" />
          <h1 className="text-3xl font-bold text-gray-800">{APP_NAME}</h1>
          <p className="text-gray-600 mt-2">Acesse sua conta para acompanhar seu projeto.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (ou Usuário)
            </label>
            <input
              id="email"
              type="text" // Keep as text to allow usernames that might not be emails
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
              placeholder="seu.email@exemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
              placeholder="********"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
          Problemas para acessar? <a href="#" className="font-medium text-sky-600 hover:text-sky-500">Contate o suporte</a>.
        </p>
        <div className="mt-6 text-center border-t pt-4 border-gray-200">
            <Link to="/admin/login" className="text-sm font-medium text-slate-700 hover:text-slate-500 hover:underline">
                Acesso Administrativo
            </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;