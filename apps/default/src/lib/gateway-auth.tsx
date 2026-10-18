import * as React from 'react';
import { useAuth } from 'react-oidc-context';

/**
 * Stores the signed-in Genesis end-user's OIDC `id_token` so the gateway data
 * layer can present it to the backend for per-user row scoping.
 *
 * Unlike the previous approach, we do NOT patch global `fetch` or `XMLHttpRequest`.
 * Instead, `gatewayRequest` reads the token via {@link getGatewayIdToken} and
 * attaches `Authorization: Bearer <id_token>` directly. This avoids interfering
 * with the OIDC library's own fetch calls, which can break in the Taskade preview
 * iframe pipeline.
 */

let currentIdToken: string | null = null;

export function setGatewayIdToken(token: string | null): void {
  currentIdToken = token;
}

export function getGatewayIdToken(): string | null {
  return currentIdToken;
}

/**
 * Bridges the OIDC user's `id_token` into the gateway data layer.
 * Renders nothing. Must live inside the OIDC `<AuthProvider>`.
 */
export function GatewayAuthSync(): null {
  const auth = useAuth();
  const idToken = auth.user?.id_token ?? null;
  React.useEffect(() => {
    setGatewayIdToken(idToken);
    return () => setGatewayIdToken(null);
  }, [idToken]);
  return null;
}
