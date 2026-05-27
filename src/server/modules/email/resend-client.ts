import { getServerEnv } from "@/server/config/env";

export interface ResendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface ResendEmailResult {
  id: string;
}

interface ResendApiResponse {
  id?: unknown;
}

function senderAddress(fromName: string, fromAddress: string): string {
  return `${fromName} <${fromAddress}>`;
}

export async function sendEmailWithResend(
  input: ResendEmailInput,
): Promise<ResendEmailResult> {
  const env = getServerEnv();

  if (!env.EMAIL_SENDING_ENABLED) {
    throw new Error("Email sending is disabled.");
  }

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
    throw new Error("Resend email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: senderAddress(env.EMAIL_FROM_NAME, env.EMAIL_FROM_ADDRESS),
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as ResendApiResponse;

  if (typeof body.id !== "string" || !body.id) {
    throw new Error("Resend API response did not include an email id.");
  }

  return {
    id: body.id,
  };
}
