'use client'

import { useState, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: unknown[]) => void) => void
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void
    }
  }
}

interface MetaMaskState {
  isInstalled: boolean
  isConnected: boolean
  account: string | null
  chainId: string | null
  isConnecting: boolean
  error: string | null
}

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    isInstalled: false,
    isConnected: false,
    account: null,
    chainId: null,
    isConnecting: false,
    error: null,
  })

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = async () => {
      if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
        setState(prev => ({ ...prev, isInstalled: true }))
        
        // Check if already connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string
            setState(prev => ({
              ...prev,
              isConnected: true,
              account: accounts[0],
              chainId,
            }))
          }
        } catch {
          // Not connected yet, that's fine
        }
      }
    }
    
    checkMetaMask()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[]
      if (accs.length === 0) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
        }))
      } else {
        setState(prev => ({
          ...prev,
          isConnected: true,
          account: accs[0],
        }))
      }
    }

    const handleChainChanged = (chainId: unknown) => {
      setState(prev => ({
        ...prev,
        chainId: chainId as string,
      }))
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask is not installed' }))
      return false
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[]
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string

      setState(prev => ({
        ...prev,
        isConnected: true,
        account: accounts[0],
        chainId,
        isConnecting: false,
      }))
      
      return true
    } catch (err) {
      const error = err as { code?: number; message?: string }
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.code === 4001 
          ? 'Connection rejected by user' 
          : error.message || 'Failed to connect',
      }))
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
    }))
  }, [])

  const signTransaction = useCallback(async (data: {
    certificateId: string
    patientId: string
    certificateType: string
    issuedBy: string
    issueDate: string
  }): Promise<{ signature: string; transactionHash: string } | null> => {
    if (!window.ethereum || !state.account) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return null
    }

    try {
      // Create a message to sign
      const message = JSON.stringify({
        action: 'Issue Health Certificate',
        certificateId: data.certificateId,
        patientId: data.patientId,
        certificateType: data.certificateType,
        issuedBy: data.issuedBy,
        issueDate: data.issueDate,
        timestamp: new Date().toISOString(),
      })

      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, state.account],
      }) as string

      // Generate a pseudo transaction hash from the signature
      const transactionHash = '0x' + signature.slice(2, 66)

      return { signature, transactionHash }
    } catch (err) {
      const error = err as { code?: number; message?: string }
      setState(prev => ({
        ...prev,
        error: error.code === 4001 
          ? 'Transaction rejected by user' 
          : error.message || 'Failed to sign transaction',
      }))
      return null
    }
  }, [state.account])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    clearError,
  }
}
