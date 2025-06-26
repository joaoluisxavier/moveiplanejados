
import React from 'react';
import { APP_NAME } from '../../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-sky-800 text-sky-100 py-8 text-center">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</p>
        <p className="text-sm mt-1">Sua satisfação é nosso principal objetivo.</p>
      </div>
    </footer>
  );
};

export default Footer;
