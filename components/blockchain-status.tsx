'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Server, Hash, Box } from 'lucide-react'

interface BlockchainStatus {
  connected: boolean
  network: string
  blockNumber: number
  contractAddress: string
}

export function BlockchainStatus() {
  const [status, setStatus] = useState<BlockchainStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/blockchain/status')
        const data = await res.json()
        setStatus(data)
      } catch (error) {
        console.error('Failed to fetch blockchain status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
    // Refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Blockchain Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Blockchain Status
            </CardTitle>
            <CardDescription>Ethereum network connection</CardDescription>
          </div>
          <Badge
            variant={status?.connected ? 'default' : 'secondary'}
            className={status?.connected ? 'bg-success text-success-foreground' : ''}
          >
            {status?.connected ? 'Connected' : 'Demo Mode'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Network</span>
            </div>
            <span className="text-sm font-medium">{status?.network || 'Unknown'}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Block Number</span>
            </div>
            <span className="text-sm font-medium font-mono">{status?.blockNumber || 0}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Contract</span>
            </div>
            <span className="text-xs font-mono truncate max-w-[200px]">
              {status?.contractAddress || 'Not deployed'}
            </span>
          </div>

          {!status?.connected && (
            <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                <strong>Demo Mode:</strong> Running with simulated blockchain. To connect to real
                Hardhat network, start the local node and deploy the contract.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
