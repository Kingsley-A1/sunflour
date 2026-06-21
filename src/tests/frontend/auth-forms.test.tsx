import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { ResetPasswordForm } from "@/app/(public)/reset-password/reset-password-form";

describe("auth form polish", () => {
  it("renders the branded Google sign-in affordance", () => {
    const html = renderToStaticMarkup(
      <GoogleAuthButton onClick={() => undefined} />,
    );

    expect(html).toContain("Continue with Google");
    expect(html).toContain("#4285F4");
    expect(html).toContain("#EA4335");
  });

  it("announces status and error messages accessibly", () => {
    const successHtml = renderToStaticMarkup(
      <FormStatusMessage message="Reset link sent." tone="success" />,
    );
    const errorHtml = renderToStaticMarkup(
      <FormStatusMessage message="Password could not be updated." tone="danger" />,
    );

    expect(successHtml).toContain('role="status"');
    expect(successHtml).toContain('aria-live="polite"');
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('aria-live="assertive"');
  });

  it("removes the raw token field from password reset and guides broken links", () => {
    const readyHtml = renderToStaticMarkup(
      <ResetPasswordForm
        initialEmail="hello@sunflour.test"
        initialToken="reset-token"
      />,
    );
    const brokenLinkHtml = renderToStaticMarkup(
      <ResetPasswordForm initialEmail="" initialToken="" />,
    );

    expect(readyHtml).toContain("Resetting password for");
    expect(readyHtml).toContain("hello@sunflour.test");
    expect(readyHtml).not.toContain("Reset token");
    expect(brokenLinkHtml).toContain("Request a new reset link");
    expect(brokenLinkHtml).toContain('role="status"');
  });
});
