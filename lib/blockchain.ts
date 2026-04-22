// Blockchain service for Healthcare Certificate Verification
// This file handles both simulated blockchain (for demo) and real Hardhat connection

import { ethers } from 'ethers'

// Contract ABI (minimal interface needed)
const CONTRACT_ABI = [
  "function storeCertificate(string certificateId, string patientId, string certificateType, string issuedBy, uint256 issueDate) external returns (bytes32)",
  "function verifyCertificate(bytes32 certificateHash) external view returns (bool isValid, string certificateType, string issuedBy, uint256 issueDate, uint256 timestamp, bool revoked)",
  "function getCertificate(bytes32 certificateHash) external view returns (string certificateId, string patientId, string certificateType, string issuedBy, uint256 issueDate, uint256 timestamp, bool exists, bool revoked)",
  "function getTotalCertificates() external view returns (uint256)",
  "event CertificateStored(bytes32 indexed certificateHash, string certificateId, string patientId, string certificateType, string issuedBy, uint256 issueDate, uint256 timestamp)"
]

// Configuration
const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

interface BlockchainTransaction {
  transactionId: string
  hash: string
  blockNumber: number
  timestamp: number
  data: string
}

// Simulated blockchain storage (for demo mode when Hardhat is not running)
const simulatedBlockchain: Map<string, BlockchainTransaction> = new Map()
let currentBlockNumber = 1000

// Check if we're in demo mode or connected to real blockchain
async function isHardhatRunning(): Promise<boolean> {
  if (!CONTRACT_ADDRESS) return false
  
  try {
    const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL)
    await provider.getBlockNumber()
    return true
  } catch {
    return false
  }
}

// Generate hash for certificate data
function generateHash(data: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(data))
}

function generateTransactionId(): string {
  return ethers.hexlify(ethers.randomBytes(32))
}

// Get ethers provider and contract
async function getContract() {
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL)
  const signer = await provider.getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

export const blockchainService = {
  // Store certificate hash on blockchain
  storeCertificate: async (certificateData: {
    certificateId: string
    patientId: string
    certificateType: string
    issuedBy: string
    issueDate: Date
  }): Promise<{ hash: string; transactionId: string; blockNumber: number }> => {
    const isReal = await isHardhatRunning()
    
    if (isReal) {
      // Real blockchain interaction
      try {
        const contract = await getContract()
        const issueDateTimestamp = Math.floor(certificateData.issueDate.getTime() / 1000)
        
        const tx = await contract.storeCertificate(
          certificateData.certificateId,
          certificateData.patientId,
          certificateData.certificateType,
          certificateData.issuedBy,
          issueDateTimestamp
        )
        
        const receipt = await tx.wait()
        
        // Get the certificate hash from the event
        const event = receipt.logs.find(
          (log: ethers.Log) => log.topics[0] === ethers.id("CertificateStored(bytes32,string,string,string,string,uint256,uint256)")
        )
        
        const hash = event?.topics[1] || generateHash(JSON.stringify(certificateData))
        
        return {
          hash,
          transactionId: receipt.hash,
          blockNumber: receipt.blockNumber,
        }
      } catch (error) {
        console.error('[v0] Blockchain error:', error)
        // Fall back to simulation if real blockchain fails
      }
    }
    
    // Simulated blockchain (demo mode)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const dataString = JSON.stringify(certificateData)
    const hash = generateHash(dataString)
    const transactionId = generateTransactionId()
    currentBlockNumber++

    const transaction: BlockchainTransaction = {
      transactionId,
      hash,
      blockNumber: currentBlockNumber,
      timestamp: Date.now(),
      data: dataString,
    }

    simulatedBlockchain.set(hash, transaction)

    return {
      hash,
      transactionId,
      blockNumber: currentBlockNumber,
    }
  },

  // Verify certificate on blockchain
  verifyCertificate: async (hash: string): Promise<{
    isValid: boolean
    transaction?: BlockchainTransaction
    message: string
    onChain?: boolean
  }> => {
    const isReal = await isHardhatRunning()
    
    if (isReal) {
      try {
        const contract = await getContract()
        const result = await contract.verifyCertificate(hash)
        
        if (result.isValid) {
          return {
            isValid: true,
            onChain: true,
            transaction: {
              transactionId: hash,
              hash,
              blockNumber: 0,
              timestamp: Number(result.timestamp) * 1000,
              data: JSON.stringify({
                certificateType: result.certificateType,
                issuedBy: result.issuedBy,
                issueDate: new Date(Number(result.issueDate) * 1000),
                revoked: result.revoked
              })
            },
            message: result.revoked 
              ? 'Certificate found but has been revoked' 
              : 'Certificate verified on Ethereum blockchain',
          }
        }
      } catch (error) {
        console.error('[v0] Blockchain verify error:', error)
      }
    }

    // Check simulated blockchain
    await new Promise((resolve) => setTimeout(resolve, 300))

    const transaction = simulatedBlockchain.get(hash)

    if (transaction) {
      return {
        isValid: true,
        transaction,
        onChain: false,
        message: 'Certificate verified (Demo Mode)',
      }
    }

    // Check pre-seeded hashes
    const preseededHashes = [
      '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      '0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278',
    ]

    if (preseededHashes.includes(hash)) {
      return {
        isValid: true,
        onChain: false,
        transaction: {
          transactionId: generateTransactionId(),
          hash,
          blockNumber: 1000 + Math.floor(Math.random() * 100),
          timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
          data: 'Pre-existing certificate data',
        },
        message: 'Certificate verified (Demo Mode)',
      }
    }

    return {
      isValid: false,
      onChain: false,
      message: 'Certificate not found on blockchain',
    }
  },

  // Get blockchain status
  getStatus: async (): Promise<{
    connected: boolean
    network: string
    blockNumber: number
    contractAddress: string
  }> => {
    const isReal = await isHardhatRunning()
    
    if (isReal) {
      try {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL)
        const network = await provider.getNetwork()
        const blockNumber = await provider.getBlockNumber()
        
        return {
          connected: true,
          network: `Hardhat (Chain ID: ${network.chainId})`,
          blockNumber,
          contractAddress: CONTRACT_ADDRESS,
        }
      } catch {
        // Fall through to demo mode
      }
    }
    
    return {
      connected: false,
      network: 'Demo Mode (Simulated)',
      blockNumber: currentBlockNumber,
      contractAddress: 'Not deployed',
    }
  },

  // Get transaction details
  getTransaction: async (transactionId: string): Promise<BlockchainTransaction | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    
    for (const tx of simulatedBlockchain.values()) {
      if (tx.transactionId === transactionId) {
        return tx
      }
    }
    return null
  },

  // Get current block number
  getCurrentBlock: async (): Promise<number> => {
    const isReal = await isHardhatRunning()
    
    if (isReal) {
      try {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL)
        return await provider.getBlockNumber()
      } catch {
        // Fall through to simulated
      }
    }
    
    return currentBlockNumber
  },
}
