// app/.well-known/microsoft-identity-association/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    associatedApplications: [
      {
        // Make sure this ENV variable is available during build/runtime
        applicationId: process.env.AUTH_AZURE_AD_ID, // Use your actual ENV var name
        serviceUrls: [
          process.env.NEXT_PUBLIC_APP_URL || 'https://slics.vercel.app/', // Use NEXT_PUBLIC_APP_URL for dynamic base URL
          // Add other relevant base URLs if needed
        ],
      },
    ],
  };

  // NextResponse.json() automatically sets Content-Type: application/json
  return NextResponse.json(data);
}
