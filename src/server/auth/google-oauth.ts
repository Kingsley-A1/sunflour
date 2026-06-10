import { getServerEnv } from "@/server/config/env";

export interface GoogleProviderCredentials {
  clientId: string;
  clientSecret: string;
}

export function getGoogleProviderCredentials(
  input: Record<string, string | undefined> = process.env,
): GoogleProviderCredentials | null {
  const env = getServerEnv(input);

  if (!env.AUTH_GOOGLE_ID || !env.AUTH_GOOGLE_SECRET) {
    return null;
  }

  return {
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
  };
}
