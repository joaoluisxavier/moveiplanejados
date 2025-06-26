
import React from 'react';
import { AppNotification } from '../../types';

interface NotificationContainerProps {
  notifications: AppNotification[];
}

const NotificationItem: React.FC<{ notification: AppNotification }> = ({ notification }) => {
  const baseStyle = "p-4 mb-3 rounded-lg shadow-md text-sm font-medium";
  const typeStyles = {
    success: "bg-green-100 border border-green-400 text-green-700",
    error: "bg-red-100 border border-red-400 text-red-700",
    info: "bg-sky-100 border border-sky-400 text-sky-700",
  };

  return (
    <div className={`${baseStyle} ${typeStyles[notification.type]}`}>
      {notification.message}
    </div>
  );
};

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications }) => {
  if (!notifications.length) return null;

  return (
    <div className="fixed top-20 right-4 w-80 z-[100]">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationContainer;
