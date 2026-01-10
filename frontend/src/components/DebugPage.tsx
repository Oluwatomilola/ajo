
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { gatherDiagnosticsData, clearDiagnosticsData } from '../utils/diagnostics'
import type { DiagnosticsData } from '../types/diagnostics'

interface StatusBadgeProps {
  status: boolean | 'pending' | 'success' | 'error' | 'unknown'
  successText?: string
  errorText?: string
  pendingText?: string
}

function StatusBadge({ status, successText = 'OK', errorText = 'Error', pendingText = 'Pending' }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (status === true || status === 'success') return 'bg-green-100 text-green-800 border-green-200'
    if (status === false || status === 'error') return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getStatusText = () => {
    if (status === true || status === 'success') return successText
    if (status === false || status === 'error') return errorText
    return pendingText
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  )
}

interface DiagnosticSectionProps {
  title: string
  children: React.ReactNode
  isExpanded?: boolean
  onToggle?: () => void
}

function DiagnosticSection({ title, children, isExpanded = true, onToggle }: DiagnosticSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
      <div 
        className="px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      {isExpanded && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}

function formatDistanceToNow(date: Date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

export function DebugPage() {
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    blockchain: true,
    contract: true,
    transactions: true,
    environment: true
  })

  const { address, chain, connector } = useAccount()

  const loadDiagnostics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await gatherDiagnosticsData()
      setDiagnosticsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagnostics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDiagnostics()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleClearData = () => {
    clearDiagnosticsData()
    loadDiagnostics()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading) {
    return (
      <div className="debug-page min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading diagnostics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="debug-page min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-600 text-xl mb-4">⚠️ Error Loading Diagnostics</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadDiagnostics}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!diagnosticsData) {
    return (
      <div className="debug-page min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No diagnostics data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="debug-page min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔧 System Diagnostics</h1>
              <p className="text-gray-600 mt-2">
                Development-only diagnostics page for debugging blockchain and contract issues
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadDiagnostics}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleClearData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                🗑️ Clear Data
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Version:</span>
              <span className="ml-2 font-mono">{diagnosticsData.version}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2">
                {formatDistanceToNow(new Date(diagnosticsData.timestamp))}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Environment:</span>
              <StatusBadge 
                status={diagnosticsData.environment.isDevelopment} 
                successText="Development" 
                errorText="Production"
              />
            </div>
            <div>
              <span className="font-medium text-gray-700">Connection:</span>
              <StatusBadge 
                status={diagnosticsData.blockchainConnection.isConnected} 
                successText="Connected" 
                errorText="Disconnected"
              />
            </div>
          </div>
        </div>

        {/* Blockchain Connection Status */}
        <DiagnosticSection
          title="🌐 Blockchain Connection"
          isExpanded={expandedSections.blockchain}
          onToggle={() => toggleSection('blockchain')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Connection Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <StatusBadge status={diagnosticsData.blockchainConnection.isConnected} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain ID:</span>
                  <span className="font-mono">{diagnosticsData.blockchainConnection.chainId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network:</span>
                  <span>{diagnosticsData.blockchainConnection.chainName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{diagnosticsData.blockchainConnection.networkType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest Block:</span>
                  <span className="font-mono">{diagnosticsData.blockchainConnection.blockNumber}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">RPC & Timing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">RPC URL:</span>
                  <button
                    onClick={() => copyToClipboard(diagnosticsData.blockchainConnection.rpcUrl || '')}
                    className="text-blue-600 hover:text-blue-800 text-xs font-mono max-w-xs truncate"
                    title="Click to copy"
                  >
                    {diagnosticsData.blockchainConnection.rpcUrl}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Block Time:</span>
                  <span>
                    {diagnosticsData.blockchainConnection.lastBlockTime 
                      ? formatDistanceToNow(new Date(diagnosticsData.blockchainConnection.lastBlockTime))
                      : 'N/A'
                    }
                  </span>
                </div>
                {diagnosticsData.blockchainConnection.error && (
                  <div className="mt-3">
                    <span className="text-red-600 font-medium">Error:</span>
                    <p className="text-red-600 text-sm mt-1">{diagnosticsData.blockchainConnection.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DiagnosticSection>

        {/* Contract Status */}
        <DiagnosticSection
          title="📜 Contract Status"
          isExpanded={expandedSections.contract}
          onToggle={() => toggleSection('contract')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Contract Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <button
                    onClick={() => copyToClipboard(diagnosticsData.contract.address)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-mono"
                    title="Click to copy"
                  >
                    {diagnosticsData.contract.address}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valid Address:</span>
                  <StatusBadge status={diagnosticsData.contract.isValid} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Is Deployed:</span>
                  <StatusBadge status={diagnosticsData.contract.isDeployed} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ABI Valid:</span>
                  <StatusBadge status={diagnosticsData.contract.abiValid} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Match:</span>
                  <StatusBadge status={diagnosticsData.contract.networkMatch} />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Contract Interface</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Functions:</span>
                  <span>{diagnosticsData.contract.functions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Events:</span>
                  <span>{diagnosticsData.contract.events?.length || 0}</span>
                </div>
                {diagnosticsData.contract.error && (
                  <div className="mt-3">
                    <span className="text-red-600 font-medium">Error:</span>
                    <p className="text-red-600 text-sm mt-1">{diagnosticsData.contract.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Functions and Events */}
          {diagnosticsData.contract.functions && diagnosticsData.contract.functions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Available Functions</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="space-y-1 text-xs font-mono">
                  {diagnosticsData.contract.functions.map((func, index) => (
                    <div key={index} className="flex justify-between">
                      <span className={`px-2 py-1 rounded ${
                        func.stateMutability === 'view' ? 'bg-blue-100 text-blue-800' :
                        func.stateMutability === 'payable' ? 'bg-green-100 text-green-800' :
                        func.stateMutability === 'pure' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {func.stateMutability}
                      </span>
                      <span className="text-gray-900">{func.signature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DiagnosticSection>

        {/* Recent Transactions */}
        <DiagnosticSection
          title="💳 Recent Transactions"
          isExpanded={expandedSections.transactions}
          onToggle={() => toggleSection('transactions')}
        >
          {diagnosticsData.lastTransactions.length > 0 ? (
            <div className="space-y-4">
              {diagnosticsData.lastTransactions.map((tx, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-gray-900">Transaction {index + 1}</h5>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hash:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">{tx.hash.substring(0, 10)}...{tx.hash.substring(58)}</span>
                        <button
                          onClick={() => copyToClipboard(tx.hash)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 capitalize">{tx.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="ml-2">
                        {formatDistanceToNow(new Date(tx.timestamp))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Block:</span>
                      <span className="ml-2 font-mono">{tx.blockNumber || 'Pending'}</span>
                    </div>
                  </div>
                  {tx.error && (
                    <div className="mt-2 text-red-600 text-sm">
                      <span className="font-medium">Error:</span> {tx.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions found</p>
          )}
        </DiagnosticSection>

        {/* Environment Information */}
        <DiagnosticSection
          title="⚙️ Environment"
          isExpanded={expandedSections.environment}
          onToggle={() => toggleSection('environment')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Application Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Node Environment:</span>
                  <span className="font-mono">{diagnosticsData.environment.nodeEnv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Development Mode:</span>
                  <StatusBadge status={diagnosticsData.environment.isDevelopment} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Production Mode:</span>
                  <StatusBadge status={diagnosticsData.environment.isProduction} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">App Version:</span>
                  <span className="font-mono">{diagnosticsData.environment.appVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Build Timestamp:</span>
                  <span className="text-xs">{new Date(diagnosticsData.environment.buildTimestamp || '').toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain ID:</span>
                  <span className="font-mono">{diagnosticsData.environment.chainId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">REOWN Project:</span>
                  <StatusBadge 
                    status={diagnosticsData.environment.reownProjectId !== 'missing'} 
                    successText="Configured" 
                    errorText="Missing"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract Address:</span>
                  <span className="text-xs">
                    {diagnosticsData.environment.piggyBankAddress !== 'not configured' ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Diagnostics Enabled:</span>
                  <StatusBadge status={diagnosticsData.environment.featureFlags?.diagnosticsEnabled || false} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Current Wallet Connection */}
          {address && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Current Wallet Connection</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Address:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs">{address.substring(0, 6)}...{address.substring(38)}</span>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Connector:</span>
                  <span className="ml-2">{connector?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Network:</span>
                  <span className="ml-2">{chain?.name || 'Unknown'} ({chain?.id})</span>
                </div>
              </div>
            </div>
          )}
        </DiagnosticSection>
      </div>
    </div>
  )
}