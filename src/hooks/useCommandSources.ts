import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveKubernetesStatusResponse } from '../utils/kubernetesStatus';
import * as identity from '../utils/identityWorkloads';
import * as policy from '../utils/gatekeeperPolicies';
import * as network from '../utils/securityNetwork';
import * as verification from '../utils/securityVerification';

export interface Observation<T> {
  data: T | null;
  retrievedAt: string | null;
  error: string | null;
  isLoading: boolean;
  staleReason: string | null;
  refresh: () => void;
}

export function useSource<T extends { collectedAt: string }>(
  request: (signal: AbortSignal) => Promise<T>,
  ageReason: (time: string, now: number) => string | null,
): Observation<T> {
  const [data, setData] = useState<T | null>(null);
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [age, setAge] = useState<string | null>(null);
  const active = useRef<AbortController>();
  const refresh = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    try {
      const next = await request(controller.signal);
      if (controller.signal.aborted) return;
      setData(next);
      setRetrievedAt(new Date().toISOString());
      setAge(ageReason(next.collectedAt, Date.now()));
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Source unavailable');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [request, ageReason]);
  useEffect(() => {
    void refresh();
    return () => active.current?.abort();
  }, [refresh]);
  useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => setAge(ageReason(data.collectedAt, Date.now())), 1000);
    return () => clearInterval(timer);
  }, [data, ageReason]);
  const staleReason = data && (isLoading ? 'Refresh pending; showing previous snapshot' :
    error ? 'Latest refresh failed; showing previous snapshot' : age);
  return { data, retrievedAt, error, isLoading, staleReason, refresh };
}

export function useCommandSources(cluster: Observation<LiveKubernetesStatusResponse>) {
  return {
    cluster,
    policy: useSource(policy.requestGatekeeperPolicies, policy.snapshotAgeReason),
    network: useSource(network.requestSecurityNetwork, network.snapshotAgeReason),
    identity: useSource(identity.requestIdentityWorkloads, identity.snapshotAgeReason),
    verification: useSource(verification.requestSecurityVerification, verification.snapshotAgeReason),
  };
}

export type CommandSources = ReturnType<typeof useCommandSources>;
