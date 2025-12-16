import { test, expect } from '@playwright/test';

test.describe('Integration Launcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/launcher');
  });

  test('should display the launcher page with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Integration');
  });

  test('should display all integration tiles', async ({ page }) => {
    // Check for key integrations by their span text (more specific than getByText which matches SVG title too)
    await expect(page.locator('span:has-text("Jira")')).toBeVisible();
    await expect(page.locator('span:has-text("Slack")')).toBeVisible();
    await expect(page.locator('span:has-text("Confluence")')).toBeVisible();
    await expect(page.locator('span:has-text("Rootly")')).toBeVisible();
    await expect(page.locator('span:has-text("New Relic")')).toBeVisible();
    await expect(page.locator('span:has-text("Coralogix")')).toBeVisible();
    await expect(page.locator('span:has-text("Metabase")')).toBeVisible();
    await expect(page.locator('span:has-text("GitHub")')).toBeVisible();
    await expect(page.locator('span:has-text("PagerDuty")')).toBeVisible();
  });

  test('should display Rootly with correct brand icon', async ({ page }) => {
    // Check Rootly tile exists with the SVG title
    const rootlySvg = page.locator('svg:has(title:has-text("Rootly"))');
    await expect(rootlySvg).toBeAttached();

    // Check the span with Rootly text
    await expect(page.locator('span:has-text("Rootly")')).toBeVisible();
  });

  test('should display New Relic with correct brand icon', async ({ page }) => {
    // Check New Relic SVG exists
    const newRelicSvg = page.locator('svg:has(title:has-text("New Relic"))');
    await expect(newRelicSvg).toBeAttached();

    // Check the span with New Relic text
    await expect(page.locator('span:has-text("New Relic")')).toBeVisible();
  });

  test('should display Coralogix with correct brand icon', async ({ page }) => {
    // Check Coralogix SVG exists
    const coralogixSvg = page.locator('svg:has(title:has-text("Coralogix"))');
    await expect(coralogixSvg).toBeAttached();

    // Check the span with Coralogix text
    await expect(page.locator('span:has-text("Coralogix")')).toBeVisible();
  });

  test('should select an integration tile when clicked', async ({ page }) => {
    // Click on Rootly tile using the span
    await page.locator('span:has-text("Rootly")').click();

    // Check if launch button appears with the selected integration name
    await expect(page.getByRole('button', { name: /Launch Rootly/i })).toBeVisible();
  });

  test('should show badges on appropriate tiles', async ({ page }) => {
    // Check that "New" badge exists (from New Relic)
    await expect(page.locator('span:has-text("New"):not(:has-text("Relic"))')).toBeVisible();

    // Check that "Beta" badge exists (from Metabase)
    await expect(page.locator('span:has-text("Beta")')).toBeVisible();
  });
});

test.describe('Logo Components', () => {
  test('Rootly logo renders with correct gradient', async ({ page }) => {
    await page.goto('/launcher');

    // Check the gradient exists in the SVG (linearGradient elements are not visible, just attached)
    const rootlyGradient = page.locator('#rootly-grad');
    await expect(rootlyGradient).toBeAttached();
  });

  test('Coralogix logo renders with brand colors', async ({ page }) => {
    await page.goto('/launcher');

    // Check for Coralogix SVG with the ellipse using brand color
    const coralogixSvg = page.locator('svg:has(title:has-text("Coralogix"))');
    await expect(coralogixSvg).toBeAttached();

    // Check ellipse with the brand color exists
    const coralogixEllipse = page.locator('ellipse[fill="#3CC48F"]');
    await expect(coralogixEllipse).toBeAttached();
  });

  test('New Relic logo renders correctly', async ({ page }) => {
    await page.goto('/launcher');

    // Check the New Relic icon is inside the green container
    const newRelicContainer = page.locator('.bg-\\[\\#1CE783\\]');
    await expect(newRelicContainer).toBeVisible();
  });
});

test.describe('Dashboard Page', () => {
  test('should load the main dashboard', async ({ page }) => {
    await page.goto('/');

    // Dashboard should load without errors
    await expect(page).toHaveTitle(/TheBridge/i);
  });
});
