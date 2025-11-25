import { Page } from '@playwright/test';

/**
 * Mocks a connected wallet with the specified address
 * @param page Playwright page object
 * @param address Wallet address to mock (defaults to a test address)
 */
export async function mockWalletConnection(page: Page, address = '0x1234567890123456789012345678901234567890') {
  await page.evaluate((walletAddress) => {
    // Mock window.ethereum
    window.ethereum = {
      isMetaMask: true,
      request: async (request: { method: string, params?: any[] }) => {
        if (request.method === 'eth_requestAccounts') {
          return [walletAddress];
        }
        if (request.method === 'eth_sendTransaction') {
          return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        }
        if (request.method === 'eth_chainId') {
          return '0x1'; // Mainnet
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };
  }, address);
}

/**
 * Mocks the PiggyBank contract with the specified state
 * @param page Playwright page object
 * @param options Contract state options
 */
export async function mockPiggyBankContract(
  page: Page,
  options: {
    balance?: string;
    unlockTime?: number;
    owner?: string;
  } = {}
) {
  await page.evaluate((opts) => {
    const defaultOptions = {
      balance: '1000000000000000000', // 1 ETH in wei
      unlockTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      owner: '0x1234567890123456789012345678901234567890',
      ...opts,
    };

    // @ts-ignore
    window.piggyBankContract = {
      balanceOf: () => defaultOptions.balance,
      unlockTime: () => defaultOptions.unlockTime,
      owner: () => defaultOptions.owner,
      deposit: () => ({
        wait: async () => ({
          status: 1,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
        }),
      }),
      withdraw: () => ({
        wait: async () => ({
          status: 1,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdee',
        }),
      }),
    };
  }, options);
}

/**
 * Connects a wallet in the UI
 * @param page Playwright page object
 */
export async function connectWallet(page: Page) {
  const connectButton = page.getByRole('button', { name: /connect wallet/i });
  await connectButton.click();
  await expect(page.getByText(/0x1234...7890/)).toBeVisible();
}

/**
 * Makes a deposit through the UI
 * @param page Playwright page object
 * @param amount Amount of ETH to deposit
 */
export async function makeDeposit(page: Page, amount: string) {
  const amountInput = page.getByLabel(/amount/i);
  await amountInput.fill(amount);
  
  const depositButton = page.getByRole('button', { name: /deposit eth/i });
  await depositButton.click();
  
  // Wait for the transaction to complete
  await expect(page.getByText(/deposit successful/i)).toBeVisible();
}
