import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";

describe("frontend primitives", () => {
  it("renders button loading and disabled state", () => {
    const html = renderToStaticMarkup(<Button loading>Save</Button>);

    expect(html).toContain("disabled");
    expect(html).toContain("Save");
  });

  it("renders input label and error state", () => {
    const html = renderToStaticMarkup(
      <Input error="Enter your phone number" label="Phone" name="phone" />,
    );

    expect(html).toContain("Phone");
    expect(html).toContain("aria-invalid=\"true\"");
    expect(html).toContain("Enter your phone number");
  });

  it("renders card content", () => {
    const html = renderToStaticMarkup(<Card>Content</Card>);

    expect(html).toContain("Content");
  });

  it("renders loading state with accessible busy status", () => {
    const html = renderToStaticMarkup(
      <LoadingState
        description="Loading products"
        label="Loading menu"
        skeletonCount={2}
        variant="list"
      />,
    );

    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("role=\"status\"");
    expect(html).toContain("Loading menu");
    expect(html).toContain("Loading products");
  });
});
