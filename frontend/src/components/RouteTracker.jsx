// RouteTracker — invisible component mounted inside the Router.
// Watches every route change and saves the latest one to localStorage per-user,
// so the next login can restore the user to exactly where they were.

import { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { saveLastRoute } from '../utils/sessionRestore';

export default function RouteTracker() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) return;
    saveLastRoute(user.id, { path: location.pathname, search: location.search });
  }, [user?.id, location.pathname, location.search]);

  return null;
}
