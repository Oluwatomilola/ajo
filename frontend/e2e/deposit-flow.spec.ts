import { test, expect } from '@playwright/test';

test.describe('Deposit Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock wallet connection before each test
    await page.goto('/');
    await page.evaluate(() => {
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
    });

    // Connect wallet
    await page.getByRole('button', { name: /connect wallet/i }).click();
    await expect(page.getByText(/0x1234...7890/)).toBeVisible();
  });

  test('should allow depositing ETH', async ({ page }) => {
    // Fill in deposit amount
    const amountInput = page.getByLabel(/amount/i);
    await amountInput.fill('0.1');
    await expect(amountInput).toHaveValue('0.1');

    // Mock contract interaction
    await page.evaluate(() => {
      window.piggyBankContract = {
        deposit: () => ({
          wait: async () => ({
            status: 1,
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          }),
        }),
      };
    });

    // Submit deposit
    const depositButton = page.getByRole('button', { name: /deposit eth/i });
    await depositButton.click();

    // Check for success message
    await expect(page.getByText(/deposit successful/i)).toBeVisible();
  });

  test('should show error for invalid amount', async ({ page }) => {
    // Try to submit without entering an amount
    const depositButton = page.getByRole('button', { name: /deposit eth/i });
    await depositButton.click();

    // Check for error message
    await expect(page.getByText(/please enter a valid amount/i)).toBeVisible();
  });
});
