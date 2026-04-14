/** Backend type identifier used across Route config and events. */
export type MediaBackendType = 'video' | 'street_view';

/** A single waypoint along a Street View route. */
export interface StreetViewWaypoint {
  panoId: string;
  lat: number;
  lng: number;
  heading?: number;
}

/** A driveable route loaded from routes.json. */
export interface Route {
  id: string;
  displayName: string;
  thumbnailPath: string;
  defaultBackend: MediaBackendType;
  videoUrl?: string;
  streetViewWaypoints?: StreetViewWaypoint[];
  finalPanoId?: string;
  initialHeading?: number;
}

/** Top-level config loaded from public/routes.json. */
export interface AppConfig {
  routes: Route[];
}

/** Top-level view-state machine states. */
export type AppViewState = 'picker' | 'driving' | 'celebration' | 'error' | 'out_of_gas';

/** Structured error emitted by a media backend. */
export interface BackendError {
  type: 'quota_exceeded' | 'load_failed' | 'not_supported' | 'network_error' | 'unknown';
  message: string;
  backend: MediaBackendType;
  recoverable: boolean;
}

/** Discriminated-union events emitted by a MediaBackend. */
export type MediaBackendEvent =
  | { type: 'loaded'; backend: MediaBackendType }
  | { type: 'playing'; backend: MediaBackendType }
  | { type: 'paused'; backend: MediaBackendType }
  | { type: 'seeking'; backend: MediaBackendType }
  | { type: 'seeked'; backend: MediaBackendType }
  | { type: 'ended'; backend: MediaBackendType }
  | { type: 'error'; backend: MediaBackendType; error: BackendError };
