import { NetInfoStateType, type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { getNetworkSnapshot, isOffline, onConnectionRestored, subscribeNetwork } from '@/src/lib/network';

function getServerSnapshot(): NetInfoState {
  return {
    type: NetInfoStateType.unknown,
    isConnected: true,
    isInternetReachable: null,
    details: null,
  };
}

export function useNetwork() {
  const state = useSyncExternalStore(subscribeNetwork, getNetworkSnapshot, getServerSnapshot);

  return useMemo(() => {
    const offline = isOffline(state);
    return {
      state,
      isOffline: offline,
      isOnline: !offline,
    };
  }, [state]);
}

/** Re-run when the device goes from offline → online (e.g. refetch lists). */
export function useRefetchOnReconnect(refetch: () => void) {
  const ref = useRef(refetch);
  ref.current = refetch;

  useEffect(() => {
    return onConnectionRestored(() => {
      ref.current();
    });
  }, []);
}
