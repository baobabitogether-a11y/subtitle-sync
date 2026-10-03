import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("E2E Automated Accessibility Tests (Axe Core)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./");
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
  });

  test("main landing page meets WCAG 2.1 AA accessibility standards without critical defects", async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      // Exclude third-party embedded YouTube iframe frame hierarchy
      .disableRules(["frame-title", "frame-tested"])
      .analyze();

    // Critical violations should be zero
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(
      criticalViolations,
      `Expected zero critical accessibility violations, but found:\n${JSON.stringify(criticalViolations, null, 2)}`,
    ).toEqual([]);
  });

  test("video library panel meets accessibility standards", async ({ page }) => {
    const libraryDetails = page.locator("details").filter({ hasText: "Video library" });
    if (await libraryDetails.isVisible()) {
      const isOpen = await libraryDetails.getAttribute("open");
      if (isOpen === null) {
        await libraryDetails.locator("summary").click();
      }
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("#video-library-panel")
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });

  test("parallel subtitles panel and table meet accessibility standards", async ({ page }) => {
    const subtitlesPanel = page.locator("details").filter({ hasText: "Parallel subtitles" });
    await expect(subtitlesPanel.locator("table")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('details:has-text("Parallel subtitles")')
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });

  test("header navbar and theme controls meet accessibility standards", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("header")
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });
});
