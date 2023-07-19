import { useState } from 'react';

import { useMarkAsReadNotifications } from '@/graphql/hooks/useMutations';
import { useGetNotifications, useGetUnreadNotifications } from '@/graphql/hooks/useQueries';
import { useNewNotification } from '@/graphql/hooks/useSubscription';
import { GET_UNREAD_NOTIFICATIONS } from '@/graphql/queries';

import { useAuth } from './useAuth';

export const useNotification = (notificationCount) => {
  const [fetchCounter, setFetchCounter] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [isNewNotification, setIsNewNotification] = useState(false);
  const [allNotificationCount, setAllNotificationCount] = useState(0);
  const [unreatNotificationsCounter, setUnreadNotificationsCounter] = useState(0);
  const { userInfo, token } = useAuth();

  const { fetchMore, loading } = useGetNotifications({
    variables: {
      limit: notificationCount,
      offset: (fetchCounter - 1) * notificationCount,
    },
    skip: !userInfo || !token,
    onCompleted: (result) => {
      setAllNotificationCount(result?.getNotifications?.count);
      return (fetchCounter - 1) * notificationCount === 0
        ? setNotifications([...result?.getNotifications?.rows])
        : setNotifications([...notifications, ...result?.getNotifications?.rows]);
    },
  });
  useGetUnreadNotifications({
    onCompleted: (data) => setUnreadNotificationsCounter(data?.getUnreadNotifications?.count),
  });
  const [markAsReadNotifications] = useMarkAsReadNotifications({
    refetchQueries: [GET_UNREAD_NOTIFICATIONS],
  });

  useNewNotification({
    skip: !userInfo || !token,
    onData: (result) => {
      setIsNewNotification(true);
      setUnreadNotificationsCounter((previous) => previous + 1);
      setNotifications((previous) => [
        result?.data?.data?.newNotification,
        ...previous.slice(0, (fetchCounter - 1) * notificationCount - 1),
      ]);
    },
  });

  const fetchMoreNotifications = async () => {
    setFetchCounter(fetchCounter + 1);
    setIsNewNotification(false);
    await fetchMore({
      variables: {
        limit: notificationCount,
        offset: fetchCounter * notificationCount,
      },
    });
  };

  return {
    isNewNotification,
    setIsNewNotification,
    notifications,
    notificationsLoader: loading,
    allNotificationCount,
    quantityUnreadNotifications: unreatNotificationsCounter,
    markAsReadNotifications,
    fetchMoreNotifications,
    setUnreadNotificationsCounter,
  };
};
