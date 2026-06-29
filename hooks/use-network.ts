import { useIsFocused } from '@react-navigation/native';
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

/** Re-run when the device goes from offline → online while this screen is focused. */
export function useRefetchOnReconnect(refetch: () => void) {
  const isFocused = useIsFocused();
  const ref = useRef(refetch);
  ref.current = refetch;
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  useEffect(() => {
    return onConnectionRestored(() => {
      if (!focusedRef.current) return;
      ref.current();
    });
  }, []);
}
