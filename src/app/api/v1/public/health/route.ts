import { apiSuccess } from "@/server/lib/api/response";
import { getServerEnv } from "@/server/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const env = getServerEnv();

  return apiSuccess({
    service: "sunflour-api",
    status: "ok",
    environment: env.NODE_ENV,
    timeZone: env.APP_TIME_ZONE,
    timestamp: new Date().toISOString(),
  });
}
