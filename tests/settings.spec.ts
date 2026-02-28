import { test, expect } from '@playwright/test';

// Helper function to calculate accessible contrast ratio
function getContrastRatio(rgb1: number[], rgb2: number[]) {
  const getLuminance = (rgb: number[]) => {
    const a = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper to parse "rgb(r, g, b)" into array
function parseRGB(rgbString: string) {
  const match = rgbString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

test.describe('Settings and Theme', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/settings');
        // Wait for hydration (important for next-themes)
        await page.waitForTimeout(500); 
    });

    test('should allow switching themes and verify contrast', async ({ page }) => {
        const html = page.locator('html');
        
        // --- 1. System Default ---
        // Verify radio "System" is checked by default (or exists)
        await expect(page.locator('label:has-text("System") input')).toBeAttached();

        // --- 2. Switch to Dark ---
        await page.locator('label:has-text("Dark")').click();
        await expect(html).toHaveClass(/dark/);
        
        // Check contrast in dark mode on the settings heading
        const darkHeading = page.locator('h1:has-text("Settings")');
        await darkHeading.waitFor();
        
        let contrastRatio = await page.evaluate(() => {
            const el = document.querySelector('h1')?.parentElement; // Header section
            if (!el) return null;
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            const textColor = window.getComputedStyle(document.querySelector('h1')!).color;
            return { bg: bgColor, text: textColor };
        });

        if (contrastRatio) {
            const bgStr = contrastRatio.bg;
            const txtStr = contrastRatio.text;
            const ratio = getContrastRatio(parseRGB(bgStr), parseRGB(txtStr));
            expect(ratio).toBeGreaterThan(4.5); // WCAG AA standard for normal text
        }

        // --- 3. Switch to Light ---
        await page.locator('label:has-text("Light")').click();
        // The dark class should be removed
        await expect(html).not.toHaveClass(/dark/);
        
        const lightHeading = page.locator('h1:has-text("Settings")');
        await lightHeading.waitFor();

        contrastRatio = await page.evaluate(() => {
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            const textColor = window.getComputedStyle(document.querySelector('h1')!).color;
            return { bg: bgColor, text: textColor };
        });

        if (contrastRatio) {
            const bgStr = contrastRatio.bg as string;
            const txtStr = contrastRatio.text as string;
            const ratio = getContrastRatio(parseRGB(bgStr), parseRGB(txtStr));
            expect(ratio).toBeGreaterThan(4.5); // WCAG AA standard
        }
        
        // --- 4. Verify LocalStorage Persistence ---
        const themeValue = await page.evaluate(() => localStorage.getItem('theme'));
        expect(themeValue).toBe('light'); // We just switched to light
        
        // Reload page to ensure persistence
        await page.reload();
        await page.waitForTimeout(500);
        await expect(html).not.toHaveClass(/dark/);
    });
});
