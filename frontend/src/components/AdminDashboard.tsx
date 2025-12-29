import { useState } from 'react';
import { usePiggyBank } from '../hooks/usePiggyBank';
import { formatEther } from 'viem';

export function AdminDashboard() {
  const [showAll, setShowAll] = useState(false);
  const { balance, totalDeposits, totalWithdrawals, transactions } = usePiggyBank();

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  return (
    <div className="admin-dashboard">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Balance</h3>
          <p className="text-2xl font-bold" aria-live="polite" aria-label={`Total contract balance: ${balance ? formatEther(balance) : '0.00'} ETH`}>
            {balance ? formatEther(balance) : '0.00'} ETH
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Deposits</h3>
          <p className="text-2xl font-bold" aria-live="polite" aria-label={`Total deposits: ${totalDeposits ? formatEther(totalDeposits) : '0.00'} ETH`}>
            {totalDeposits ? formatEther(totalDeposits) : '0.00'} ETH
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Withdrawals</h3>
          <p className="text-2xl font-bold" aria-live="polite" aria-label={`Total withdrawals: ${totalWithdrawals ? formatEther(totalWithdrawals) : '0.00'} ETH`}>
            {totalWithdrawals ? formatEther(totalWithdrawals) : '0.00'} ETH
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          {transactions.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              aria-expanded={showAll}
              aria-controls="transactions-table"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table id="transactions-table" className="min-w-full divide-y divide-gray-200" role="table" aria-label="Transaction history">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`} aria-label={`Transaction type: ${tx.type}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.amount} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span aria-label={`User address: ${tx.user}`}>
                        {`${tx.user.substring(0, 6)}...${tx.user.substring(38)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        // Support timestamps in seconds or milliseconds
                        const raw = Number(tx.timestamp || Date.now())
                        const ms = raw > 1e12 ? raw : raw * 1000
                        return (
                          <time dateTime={new Date(ms).toISOString()}>
                            {new Date(ms).toLocaleString()}
                          </time>
                        )
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500" aria-live="polite">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
