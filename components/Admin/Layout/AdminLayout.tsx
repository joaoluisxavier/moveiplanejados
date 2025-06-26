import React from 'react';
import AdminNavbar from './AdminNavbar';
// We can create a specific AdminFooter or reuse the existing one if suitable.
// For now, let's assume no specific admin footer or a very simple one.

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-200 to-slate-300">
      <AdminNavbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-slate-800 text-slate-200 py-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Painel Administrativo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default AdminLayout;