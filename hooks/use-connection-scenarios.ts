"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ScenarioActiveResponse,
  ScenarioActivateResponse,
} from "@/types/connection-scenario";

// =============================================================================
// useConnectionScenarios — Active Scenario State & Activation Hook
// =============================================================================
// Manages which connection scenario is active and handles activation
// (sending the network mode AT command to the modem).
//
// This hook does NOT manage scenario definitions (icons, gradients, patterns)
// — those are UI concerns owned by the component layer.
//
// Backend endpoints:
//   GET  /cgi-bin/quecmanager/scenarios/active.sh    → active scenario ID
//   POST /cgi-bin/quecmanager/scenarios/activate.sh  → apply scenario
//
// Usage:
//   const {
//     activeScenarioId, isLoading, isActivating, error,
//     activateScenario, refresh
//   } = useConnectionScenarios();
// =============================================================================

const CGI_BASE = "/cgi-bin/quecmanager/scenarios";

export interface UseConnectionScenariosReturn {
  /** Currently active scenario ID (defaults to "balanced") */
  activeScenarioId: string;
  /** True during initial fetch of active scenario */
  isLoading: boolean;
  /** True while an activation request is in flight */
  isActivating: boolean;
  /** Error message from the last operation */
  error: string | null;
  /** Activate a scenario by ID. Returns success boolean. */
  activateScenario: (id: string) => Promise<boolean>;
  /** Manually refresh the active scenario state */
  refresh: () => void;
}

export function useConnectionScenarios(): UseConnectionScenariosReturn {
  const [activeScenarioId, setActiveScenarioId] = useState("balanced");
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch active scenario from backend
  // ---------------------------------------------------------------------------
  const fetchActive = useCallback(async () => {
    try {
      const resp = await fetch(`${CGI_BASE}/active.sh`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data: ScenarioActiveResponse = await resp.json();
      if (!mountedRef.current) return;

      setActiveScenarioId(data.active_scenario_id || "balanced");
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to load active scenario"
      );
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  // ---------------------------------------------------------------------------
  // Activate a scenario
  // ---------------------------------------------------------------------------
  const activateScenario = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      setIsActivating(true);

      try {
        const resp = await fetch(`${CGI_BASE}/activate.sh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const data: ScenarioActivateResponse = await resp.json();
        if (!mountedRef.current) return false;

        if (!data.success) {
          setError(data.detail || data.error || "Failed to activate scenario");
          return false;
        }

        // Optimistic update — backend confirmed success
        setActiveScenarioId(id);
        return true;
      } catch (err) {
        if (!mountedRef.current) return false;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to activate scenario"
        );
        return false;
      } finally {
        if (mountedRef.current) {
          setIsActivating(false);
        }
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Manual refresh
  // ---------------------------------------------------------------------------
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchActive();
  }, [fetchActive]);

  return {
    activeScenarioId,
    isLoading,
    isActivating,
    error,
    activateScenario,
    refresh,
  };
}
