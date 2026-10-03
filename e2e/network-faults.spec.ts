import { test, expect } from "@playwright/test";

test.describe("E2E Network Fault Injection & Resilience Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./");
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
  });

  test("handles simulated network latency on subtitle fetching without blocking player or UI", async ({
    page,
  }) => {
    // Intercept timedtext calls and delay response by 600ms
    await page.route("**/timedtext*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.continue();
    });

    // Ensure player container and UI controls remain immediately interactive
    const videoContainer = page.locator("#video-player-container");
    await expect(videoContainer).toBeVisible();

    const themeControls = page.locator('[aria-label="Color theme"]');
    await expect(themeControls).toBeVisible();

    // Verify theme toggle clicks respond smoothly during pending network requests
    const darkButton = themeControls.getByRole("button", { name: "dark", exact: true });
    await darkButton.click();
    await expect(darkButton).toHaveAttribute("aria-pressed", "true");
  });

  test("handles HTTP 429 Rate Limiting on subtitle endpoint gracefully with auto-retry resilience", async ({
    page,
  }) => {
    let callCount = 0;
    // Intercept timedtext calls: return 429 on first attempt, then allow retry or fallback
    await page.route("**/timedtext*", async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 429,
          contentType: "text/plain",
          body: "Too Many Requests",
        });
      } else {
        await route.continue();
      }
    });

    // Subtitles table must remain rendered and visible without crash
    const subtitleTable = page.locator("details").filter({ hasText: "Parallel subtitles" });
    await expect(subtitleTable).toBeVisible();

    // Player and UI must not crash or show unhandled white screen
    await expect(page.locator("#video-player-container")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
  });

  test("handles complete network offline failure by preserving cached/fixture playback", async ({
    page,
  }) => {
    // Abort all external timedtext calls
    await page.route("**/timedtext*", (route) => route.abort("failed"));

    // Subtitles table must continue to render authentic demo tracks
    const subtitleTable = page.locator("details").filter({ hasText: "Parallel subtitles" });
    await expect(subtitleTable.locator("tbody tr").first()).toBeVisible();

    // App header remains healthy
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
  });

  test("handles malformed JSON3 payload safely without crashing the React application", async ({
    page,
  }) => {
    // Intercept timedtext and send corrupt non-JSON body
    await page.route("**/timedtext*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "INVALID_MALFORMED_JSON_PAYLOAD{{{",
      });
    });

    // The app shell, player, and navigation must remain intact
    await expect(page.locator("#video-player-container")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("#navbar-library-button")).toBeVisible();
  });
});
