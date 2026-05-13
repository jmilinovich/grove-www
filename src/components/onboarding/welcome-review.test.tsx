// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { WelcomeReview } from "./welcome-review";

afterEach(() => {
  cleanup();
});

describe("WelcomeReview — content", () => {
  it("renders the punchline title", () => {
    render(<WelcomeReview />);
    expect(screen.getByText("your first AI artifact is ready")).toBeTruthy();
  });

  it("renders the body prose explaining the surface-only artifact", () => {
    render(<WelcomeReview />);
    // Body explains that a daily vault review just landed and that the
    // vault wasn't touched — the load-bearing trust phrase.
    expect(screen.getByText(/needs review/i)).toBeTruthy();
    expect(screen.getByText(/surface-only/i)).toBeTruthy();
  });

  it("renders a dismiss button", () => {
    render(<WelcomeReview />);
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeTruthy();
  });

  it("uses an h2 with serif title styling (DESIGN.md text-subhead font-serif)", () => {
    const { container } = render(<WelcomeReview />);
    const heading = container.querySelector("h2");
    expect(heading).toBeTruthy();
    const className = heading?.getAttribute("class") ?? "";
    expect(className).toContain("font-serif");
    expect(className).toContain("text-subhead");
  });
});

describe("WelcomeReview — styling", () => {
  it("wraps the banner in a region with bg-surface + border + rounded-md", () => {
    const { container } = render(<WelcomeReview />);
    const region = container.querySelector('[role="region"]');
    expect(region).toBeTruthy();
    const className = region?.getAttribute("class") ?? "";
    expect(className).toContain("bg-surface");
    expect(className).toContain("border");
    expect(className).toContain("border-surface-border");
    expect(className).toContain("rounded-md");
  });

  it("styles the dismiss button with the button-primary tokens (bg-ink text-cream)", () => {
    render(<WelcomeReview />);
    const button = screen.getByRole("button", { name: /dismiss/i });
    const className = button.getAttribute("class") ?? "";
    expect(className).toContain("bg-ink");
    expect(className).toContain("text-cream");
  });

  it("labels the region as the first-run welcome for screen readers", () => {
    render(<WelcomeReview />);
    expect(screen.getByLabelText(/first-run welcome/i)).toBeTruthy();
  });
});

describe("WelcomeReview — dismiss behavior", () => {
  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<WelcomeReview onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("hides the banner after dismiss", () => {
    render(<WelcomeReview />);
    expect(screen.getByText("your first AI artifact is ready")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("your first AI artifact is ready")).toBeNull();
  });

  it("does not throw when onDismiss is not provided", () => {
    render(<WelcomeReview />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /dismiss/i })),
    ).not.toThrow();
  });
});
