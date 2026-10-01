import { test, expect } from "@playwright/test";

const observedUrl =
  "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3";
type NativeCaptionRequest = { url: string; language: string; format: string };

test.describe("Android native subtitle emulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((url) => {
      const nativeWindow = window as typeof window & {
        AndroidNativeShell?: {
          isNativeShell(): boolean;
          getLastObservedTimedTextUrl(): string;
          fetchTranslatedCaptionsWithUrl(url: string, language: string, format: string): string;
        };
        __nativeCaptionRequests?: NativeCaptionRequest[];
      };

      nativeWindow.__nativeCaptionRequests = [];
      nativeWindow.AndroidNativeShell = {
        isNativeShell: () => true,
        getLastObservedTimedTextUrl: () => url,
        fetchTranslatedCaptionsWithUrl: (requestUrl, language, format) => {
          nativeWindow.__nativeCaptionRequests?.push({ url: requestUrl, language, format });
          const events = [];
          for (let i = 0; i < 15; i++) {
            events.push({
              tStartMs: i * 4000,
              dDurationMs: 4000,
              segs: [{ utf8: `[${language.toUpperCase()}] Line ${i + 1} dialog` }],
            });
          }
          return JSON.stringify({ events });
        },
      };
    }, observedUrl);

    await page.goto("./");
    await expect(page).toHaveTitle(/Parallel Subtitles/i);
    await expect(page.locator("header")).toBeVisible();
  });

  test("replays the observed timedtext URL with original lang preserved and favorite langs applied via tlang", async ({
    page,
  }) => {
    const requests = await page.evaluate(
      () =>
        (window as typeof window & { __nativeCaptionRequests?: NativeCaptionRequest[] })
          .__nativeCaptionRequests ?? [],
    );

    const itRequest = requests.find((request) => request.language === "it");
    expect(itRequest).toBeTruthy();
    expect(itRequest?.url).toContain("lang=en");
    expect(itRequest?.url).toContain("tlang=it");
    expect(itRequest?.url).toContain("fmt=json3");

    const heRequest = requests.find((request) => request.language === "he");
    expect(heRequest).toBeTruthy();
    expect(heRequest?.url).toContain("lang=en");
    expect(heRequest?.url).toContain("tlang=he");
  });

  test("fetches every selected target language through the native bridge", async ({ page }) => {
    const targetLanguages = page.locator("#target-language-select");
    await expect(targetLanguages).toBeVisible();

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as typeof window & { __nativeCaptionRequests?: NativeCaptionRequest[] })
                .__nativeCaptionRequests?.map((request) => request.language) ?? [],
          ),
        { timeout: 10000 },
      )
      .toEqual(expect.arrayContaining(["he", "it"]));

    await targetLanguages.selectOption(["es"]);
    await expect(targetLanguages).toHaveValues(["es"]);

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as typeof window & { __nativeCaptionRequests?: NativeCaptionRequest[] })
                .__nativeCaptionRequests?.map((request) => request.language) ?? [],
          ),
        { timeout: 10000 },
      )
      .toContain("es");

    const requests = await page.evaluate(
      () =>
        (window as typeof window & { __nativeCaptionRequests?: NativeCaptionRequest[] })
          .__nativeCaptionRequests ?? [],
    );
    const esRequest = requests.find((request) => request.language === "es");
    expect(esRequest).toBeTruthy();
    expect(esRequest?.url).toContain("lang=en");
    expect(esRequest?.url).toContain("tlang=es");
    expect(esRequest?.url).toContain("fmt=json3");
    await expect(page.getByRole("status")).toContainText("live language tracks loaded");
  });

  test("renders the Android favorite-language subtitle pagination banner", async ({ page }) => {
    await expect(page.getByRole("status")).toContainText("live language tracks loaded");
    const subtitleTable = page.locator("details").filter({ hasText: "Parallel subtitles" }).last();
    await expect(subtitleTable.locator("table")).toBeVisible();

    const paginationBar = page.getByTestId("android-subtitles-pagination-bar");
    await expect(paginationBar).toBeVisible();
    await expect(paginationBar).toContainText("First 10 lines of favorite languages");
  });
});
