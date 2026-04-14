import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadRoutes, RouteSchema } from '../../src/core/routeConfig.js';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
  });
}

function makeFetchBodyError() {
  return vi.fn().mockResolvedValue({
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  });
}

function makeFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

const VALID_VIDEO_ROUTE = {
  id: 'beach-drive',
  displayName: 'Beach Drive',
  thumbnailPath: '/thumbnails/beach.png',
  defaultBackend: 'video',
  videoUrl: '/videos/beach.mp4',
};

const VALID_STREETVIEW_ROUTE = {
  id: 'park-loop',
  displayName: 'Park Loop',
  thumbnailPath: '/thumbnails/park.png',
  defaultBackend: 'street_view',
  streetViewWaypoints: [{ panoId: 'abc123', lat: 37.7, lng: -122.4 }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RouteSchema', () => {
  it('accepts a valid video route', () => {
    const result = RouteSchema.safeParse(VALID_VIDEO_ROUTE);
    expect(result.success).toBe(true);
  });

  it('accepts a valid street_view route', () => {
    const result = RouteSchema.safeParse(VALID_STREETVIEW_ROUTE);
    expect(result.success).toBe(true);
  });

  it('rejects video route without videoUrl', () => {
    const result = RouteSchema.safeParse({ ...VALID_VIDEO_ROUTE, videoUrl: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects street_view route without streetViewWaypoints', () => {
    const { streetViewWaypoints: _, ...noWaypoints } = VALID_STREETVIEW_ROUTE;
    const result = RouteSchema.safeParse(noWaypoints);
    expect(result.success).toBe(false);
  });

  it('rejects street_view route with empty waypoints array', () => {
    const result = RouteSchema.safeParse({ ...VALID_STREETVIEW_ROUTE, streetViewWaypoints: [] });
    expect(result.success).toBe(false);
  });

  it('rejects displayName exceeding 16 characters', () => {
    const result = RouteSchema.safeParse({
      ...VALID_VIDEO_ROUTE,
      displayName: 'A Very Long Display Name',
    });
    expect(result.success).toBe(false);
  });

  it('accepts displayName of exactly 16 characters', () => {
    const result = RouteSchema.safeParse({
      ...VALID_VIDEO_ROUTE,
      displayName: '1234567890123456',
    });
    expect(result.success).toBe(true);
  });
});

describe('loadRoutes', () => {
  it('returns valid routes from a well-formed config', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ routes: [VALID_VIDEO_ROUTE, VALID_STREETVIEW_ROUTE] }));
    const routes = await loadRoutes('/routes.json');
    expect(routes).toHaveLength(2);
    expect(routes[0]?.id).toBe('beach-drive');
    expect(routes[1]?.id).toBe('park-loop');
  });

  it('skips invalid entries and warns, returning only valid ones', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      makeFetchOk({
        routes: [
          VALID_VIDEO_ROUTE,
          { ...VALID_VIDEO_ROUTE, id: 'bad-no-url', videoUrl: undefined }, // invalid
          { ...VALID_VIDEO_ROUTE, id: 'bad-long-name', displayName: 'Way Too Long A Name Here' }, // invalid
          VALID_STREETVIEW_ROUTE,
          { ...VALID_STREETVIEW_ROUTE, id: 'bad-no-waypoints', streetViewWaypoints: [] }, // invalid
        ],
      }),
    );

    const routes = await loadRoutes('/routes.json');
    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.id)).toEqual(['beach-drive', 'park-loop']);
    expect(warnSpy).toHaveBeenCalledTimes(3);
    warnSpy.mockRestore();
  });

  it('returns empty array when JSON is malformed (root parse failure)', async () => {
    vi.stubGlobal('fetch', makeFetchBodyError());
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
  });

  it('returns empty array on fetch/network failure', async () => {
    vi.stubGlobal('fetch', makeFetchNetworkError());
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
  });

  it('returns empty array when root JSON is not an object with routes array', async () => {
    vi.stubGlobal('fetch', makeFetchOk([VALID_VIDEO_ROUTE]));
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
  });

  it('returns empty array when routes key is missing', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ data: [] }));
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
  });

  it('skips video route without videoUrl', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      makeFetchOk({
        routes: [{ ...VALID_VIDEO_ROUTE, videoUrl: undefined }],
      }),
    );
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('skips street_view route without waypoints', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { streetViewWaypoints: _, ...noWaypoints } = VALID_STREETVIEW_ROUTE;
    vi.stubGlobal('fetch', makeFetchOk({ routes: [noWaypoints] }));
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('skips route with displayName exceeding 16 characters', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      makeFetchOk({
        routes: [{ ...VALID_VIDEO_ROUTE, displayName: 'This Is Way Too Long Name' }],
      }),
    );
    const routes = await loadRoutes('/routes.json');
    expect(routes).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });
});
