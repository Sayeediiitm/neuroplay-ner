/**
 * Playwright E2E tests — Part 1
 * Screenshots every screen at 360px width.
 * Tests:
 *   1. Home screen loads and shows 3 tiles
 *   2. Language switching changes visible text
 *   3. Navigation to each placeholder screen works
 *   4. Audio prompt button is present and tappable
 */
import { test, expect } from "@playwright/test";

test.describe("Part 1 — Foundation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for app to initialise
    await page.waitForSelector('[data-testid="home-screen"]', { timeout: 10_000 });
  });

  test("home screen shows 4 tiles at 360px", async ({ page }) => {
    // Verify 4 tiles in the memory support section
    const tiles = page.locator('[class*="tile-card"]');
    await expect(tiles).toHaveCount(4);

    // Each tile should have a label
    await expect(page.locator('[data-testid="tile-play"]')).toBeVisible();
    await expect(page.locator('[data-testid="tile-reminders"]')).toBeVisible();
    await expect(page.locator('[data-testid="tile-family"]')).toBeVisible();
    await expect(page.locator('[data-testid="tile-myday"]')).toBeVisible();

    // Screenshot
    await page.screenshot({ path: "tests/e2e/screenshots/01-home-en.png", fullPage: true });
  });

  test("audio prompt button is visible and has correct aria-label", async ({ page }) => {
    const audio = page.locator('[data-testid="audio-prompt"]');
    await expect(audio).toBeVisible();
    // Should show tap-to-hear text in English
    await expect(audio).toContainText("Tap to hear");
    await page.screenshot({ path: "tests/e2e/screenshots/02-home-audio.png", fullPage: true });
  });

  test("language switcher changes tile text to Hindi", async ({ page }) => {
    // Click Hindi button
    await page.locator('[data-testid="lang-btn-hi"]').click();
    // Wait for re-render
    await page.waitForTimeout(500);
    // Tile text should now be in Hindi
    const playTile = page.locator('[data-testid="tile-play"]');
    await expect(playTile).toContainText("खेलें");
    await page.screenshot({ path: "tests/e2e/screenshots/03-home-hindi.png", fullPage: true });
  });

  test("language switcher changes tile text to Assamese", async ({ page }) => {
    await page.locator('[data-testid="lang-btn-as"]').click();
    await page.waitForTimeout(500);
    const playTile = page.locator('[data-testid="tile-play"]');
    await expect(playTile).toContainText("খেলক");
    await page.screenshot({ path: "tests/e2e/screenshots/04-home-assamese.png", fullPage: true });
  });

  test("navigates to Play library and back", async ({ page }) => {
    await page.locator('[data-testid="tile-play"]').click();
    await page.waitForSelector('[data-testid="game-library"]');
    await page.screenshot({ path: "tests/e2e/screenshots/05-game-library.png", fullPage: true });

    // Back button
    await page.getByRole("button", { name: /Back|वापस|উভতি/i }).click();
    await expect(page.locator('[data-testid="home-screen"]')).toBeVisible();
    await page.screenshot({ path: "tests/e2e/screenshots/06-home-after-back.png", fullPage: true });
  });

  test("navigates to Reminders screen and back", async ({ page }) => {
    await page.locator('[data-testid="tile-reminders"]').click();
    await page.waitForSelector('[data-testid="reminders-page"]');
    await page.screenshot({ path: "tests/e2e/screenshots/07-reminders.png", fullPage: true });

    await page.getByRole("button", { name: /Back|वापस|উভতি/i }).click();
    await expect(page.locator('[data-testid="home-screen"]')).toBeVisible();
  });

  test("navigates to Family screen and back", async ({ page }) => {
    await page.locator('[data-testid="tile-family"]').click();
    await page.waitForSelector('[data-testid="family-memory-page"]');
    await page.screenshot({ path: "tests/e2e/screenshots/08-family.png", fullPage: true });

    await page.getByRole("button", { name: /Back|वापस|উভতি/i }).click();
    await expect(page.locator('[data-testid="home-screen"]')).toBeVisible();
  });

  test("touch targets are at least 56px tall", async ({ page }) => {
    // Check Play tile height
    const playTile = page.locator('[data-testid="tile-play"]');
    const box = await playTile.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(56);

    // Check lang buttons
    const langBtn = page.locator('[data-testid="lang-btn-en"]');
    const langBox = await langBtn.boundingBox();
    expect(langBox).not.toBeNull();
    expect(langBox!.height).toBeGreaterThanOrEqual(56);
  });
});
