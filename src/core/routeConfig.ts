import { z } from 'zod';
import type { Route } from '../types/index.js';

const StreetViewWaypointSchema = z.object({
  panoId: z.string(),
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
});

const VideoRouteSchema = z.object({
  id: z.string(),
  displayName: z.string().max(16),
  thumbnailPath: z.string(),
  defaultBackend: z.literal('video'),
  videoUrl: z.string(),
  streetViewWaypoints: z.array(StreetViewWaypointSchema).optional(),
  finalPanoId: z.string().optional(),
  initialHeading: z.number().optional(),
});

const StreetViewRouteSchema = z.object({
  id: z.string(),
  displayName: z.string().max(16),
  thumbnailPath: z.string(),
  defaultBackend: z.literal('street_view'),
  videoUrl: z.string().optional(),
  streetViewWaypoints: z.array(StreetViewWaypointSchema).min(1),
  finalPanoId: z.string().optional(),
  initialHeading: z.number().optional(),
});

export const RouteSchema = z.discriminatedUnion('defaultBackend', [
  VideoRouteSchema,
  StreetViewRouteSchema,
]);

export type { Route };

export async function loadRoutes(url: string): Promise<Route[]> {
  let data: unknown;
  try {
    const response = await fetch(url);
    data = await response.json();
  } catch {
    return [];
  }

  if (
    data === null ||
    typeof data !== 'object' ||
    !Array.isArray((data as Record<string, unknown>)['routes'])
  ) {
    return [];
  }

  const entries = (data as { routes: unknown[] })['routes'];
  const valid: Route[] = [];

  for (const entry of entries) {
    const result = RouteSchema.safeParse(entry);
    if (result.success) {
      valid.push(result.data);
    } else {
      console.warn('[routeConfig] skipping invalid route entry:', result.error.issues);
    }
  }

  return valid;
}
