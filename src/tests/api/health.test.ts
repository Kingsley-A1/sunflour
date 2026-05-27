import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/v1/public/health/route";
import type { ApiSuccess } from "@/server/lib/api/response";

interface HealthResponse {
  service: string;
  status: string;
  environment: string;
  timeZone: string;
  timestamp: string;
}

describe("GET /api/v1/public/health", () => {
  it("returns the standard API success envelope", async () => {
    const response = GET();
    const body = (await response.json()) as ApiSuccess<HealthResponse>;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.service).toBe("sunflour-api");
    expect(body.data.status).toBe("ok");
    expect(body.data.timeZone).toBe("Africa/Lagos");
    expect(Date.parse(body.data.timestamp)).not.toBeNaN();
  });
});
