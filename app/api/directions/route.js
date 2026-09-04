import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getSlicByNumSlic, setSlicCoordinates } from '@/utils/slicsApi';
import {
  findStopsAlongRoute,
  geocodeAddress,
  getTruckRoute,
  summarizeRoute,
  TRUCK_PROFILE,
} from '@/utils/hereApi';

function isValidCoordinate(origin) {
  return (
    origin &&
    Number.isFinite(origin.lat) &&
    Number.isFinite(origin.lng) &&
    Math.abs(origin.lat) <= 90 &&
    Math.abs(origin.lng) <= 180
  );
}

// Truck route from the driver's current position to a slic
export async function POST(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.HERE_API_KEY) {
    console.error('HERE_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Routing is not configured on this server' },
      { status: 500 }
    );
  }

  try {
    const { origin, numSlic } = await request.json();

    if (!numSlic) {
      return NextResponse.json({ error: 'numSlic is required' }, { status: 400 });
    }

    if (!isValidCoordinate(origin)) {
      return NextResponse.json(
        { error: 'A valid origin { lat, lng } is required' },
        { status: 400 }
      );
    }

    const slic = await getSlicByNumSlic(numSlic);

    let destination = slic.coordinates;

    if (!isValidCoordinate(destination)) {
      const geocoded = await geocodeAddress(slic.address);
      destination = {
        lat: geocoded.lat,
        lng: geocoded.lng,
        resolvedAddress: geocoded.resolvedAddress,
      };
      await setSlicCoordinates(numSlic, destination);
    }

    const route = await getTruckRoute({ origin, destination });
    const summary = summarizeRoute(route);
    const stops = await findStopsAlongRoute(summary.polylines, origin);

    const { polylines, ...rest } = summary;

    return NextResponse.json({
      ...rest,
      stops,
      destination,
      truckProfile: TRUCK_PROFILE,
    });
  } catch (error) {
    console.error('Error building truck route:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message?.includes('Could not find coordinates')) {
      return NextResponse.json(
        { error: 'This SLIC address could not be located on the map' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Could not calculate a truck route' },
      { status: 500 }
    );
  }
}
