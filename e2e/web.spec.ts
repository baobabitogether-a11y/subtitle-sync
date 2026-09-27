import { test, expect } from "@playwright/test";

test.describe("Parallel Subtitles web app", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveTitle(/Parallel Subtitles/i);
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
  });

  test("loads fixture subtitles with constant target-language tracks", async ({ page }) => {
    const subtitleTable = page.locator("details").filter({ hasText: "Parallel subtitles" });
    await expect(subtitleTable.locator("tbody tr").first()).toBeVisible();

    const languagesPanel = page.locator("details").filter({ hasText: "Languages" });
    await expect(languagesPanel.locator("table")).toBeVisible();
    await expect(languagesPanel.locator("table tbody tr")).toHaveCount(6);

    // On web-app, target languages and subtitles are fixtures and constants; no live Android selector
    await expect(page.locator("#target-language-select")).toHaveCount(0);
  });

  test("switches themes without losing the language controls", async ({ page }) => {
    const themeControls = page.locator('[aria-label="Color theme"]');
    const darkButton = themeControls.getByRole("button", { name: "dark", exact: true });

    await darkButton.click();
    await expect(darkButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("details").filter({ hasText: "Languages" })).toBeVisible();

    await themeControls.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});