import { test, expect } from '@playwright/test';

test.describe('Withdraw Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock wallet connection and contract state
    await page.goto('/');
    await page.evaluate(() => {
      // Mock wallet
      window.ethereum = {
        isMetaMask: true,
        request: async (request: { method: string, params?: any[] }) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (request.method === 'eth_sendTransaction') {
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          }
          if (request.method === 'eth_chainId') {
            return '0x1';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };

      // Mock contract with balance and unlocked state
      window.piggyBankContract = {
        balanceOf: () => '1000000000000000000', // 1 ETH in wei
        unlockTime: () => Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
        withdraw: () => ({
          wait: async () => ({
            status: 1,
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee',
          }),
        }),
      };
    });

    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).click();
    await expect(page.getByText(/0x1234...7890/)).toBeVisible();
  });

  test('should allow withdrawing when unlocked', async ({ page }) => {
    // Check that withdraw button is enabled
    const withdrawButton = page.getByRole('button', { name: /withdraw all/i });
    await expect(withdrawButton).toBeEnabled();

    // Mock the transaction confirmation
    await page.evaluate(() => {
      // @ts-ignore
      window.confirm = () => true;
    });

    // Click withdraw button
    await withdrawButton.click();

    // Check for success message
    await expect(page.getByText(/withdrawn/i)).toBeVisible();
  });

  test('should show locked state when funds are locked', async ({ page }) => {
    // Update mock to show locked state
    await page.evaluate(() => {
      // @ts-ignore
      window.piggyBankContract = {
        ...window.piggyBankContract,
        unlockTime: () => Math.floor(Date.now() / 1000) + 3600, // 1 hour in the future
      };
    });

    // Reload the page to get the updated contract state
    await page.reload();

    // Check that withdraw button is disabled
    const withdrawButton = page.getByRole('button', { name: /withdraw all/i });
    await expect(withdrawButton).toBeDisabled();

    // Check for locked funds message
    await expect(page.getByText(/your funds are still locked/i)).toBeVisible();
  });
});
