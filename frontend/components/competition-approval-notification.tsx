'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/contexts/AuthContext';

interface ApprovalNotification {
  id: string;
  competitionId: string;
  competitionTitle: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  isRead: boolean;
}

interface CompetitionApprovalNotificationProps {
  onClose?: () => void;
  className?: string;
}

export default function CompetitionApprovalNotification({
  onClose,
  className = ''
}: CompetitionApprovalNotificationProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ApprovalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate with localStorage
      const storedNotifications = localStorage.getItem(`approval_notifications_${user?.id}`);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        const unreadNotifications = parsedNotifications.filter((n: ApprovalNotification) => !n.isRead);
        setNotifications(unreadNotifications);
        setIsVisible(unreadNotifications.length > 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local storage
      const storedNotifications = localStorage.getItem(`approval_notifications_${user?.id}`);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = parsedNotifications.map((n: ApprovalNotification) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        localStorage.setItem(`approval_notifications_${user?.id}`, JSON.stringify(updatedNotifications));
      }

      // Update state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setIsVisible(notifications.length > 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local storage
      const storedNotifications = localStorage.getItem(`approval_notifications_${user?.id}`);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = parsedNotifications.map((n: ApprovalNotification) => ({
          ...n,
          isRead: true
        }));
        localStorage.setItem(`approval_notifications_${user?.id}`, JSON.stringify(updatedNotifications));
      }

      // Update state
      setNotifications([]);
      setIsVisible(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Competition Updates ({notifications.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.status === 'approved'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  {notification.status === 'approved' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.competitionTitle}
                      </p>
                      <p className={`text-sm ${
                        notification.status === 'approved'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {notification.status === 'approved'
                          ? 'Your competition has been approved!'
                          : 'Your competition was not approved'
                        }
                      </p>
                      {notification.rejectionReason && (
                        <p className="text-xs text-gray-600 mt-1">
                          Reason: {notification.rejectionReason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => window.location.href = '/account'}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            View all competitions →
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility function to add a notification (can be called from other components)
export const addApprovalNotification = (
  userId: string,
  competitionId: string,
  competitionTitle: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
) => {
  try {
    const notification: ApprovalNotification = {
      id: `${Date.now()}-${Math.random()}`,
      competitionId,
      competitionTitle,
      status,
      rejectionReason,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const storedNotifications = localStorage.getItem(`approval_notifications_${userId}`);
    const existingNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    const updatedNotifications = [notification, ...existingNotifications];

    localStorage.setItem(`approval_notifications_${userId}`, JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};
