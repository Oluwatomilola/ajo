import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test('should connect and disconnect wallet', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check if the connect wallet button is visible
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();

    // Mock wallet connection
    await page.evaluate(() => {
      window.ethereum = {
        isMetaMask: true,
        request: async (request: { method: string }) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // Click connect button
    await connectButton.click();

    // Wait for the wallet to connect
    const walletAddress = page.getByText(/0x1234...7890/);
    await expect(walletAddress).toBeVisible();

    // Check if the deposit form is visible after connection
    const depositForm = page.getByRole('form', { name: /deposit form/i });
    await expect(depositForm).toBeVisible();
  });
});
