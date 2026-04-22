'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, Wallet, ExternalLink } from 'lucide-react'
import { useMetaMask } from '@/lib/useMetaMask'

interface User {
  id: string
  email: string
  name: string
  isVerified: boolean
}

const certificateTypes = [
  'COVID-19 Vaccination',
  'Medical Fitness Certificate',
  'Blood Test Report',
  'X-Ray Report',
  'Blood Donation Certificate',
  'Immunization Record',
  'Surgery Certificate',
  'Disability Certificate',
  'Mental Health Assessment',
  'Other',
]

export default function AdminUploadPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ message: string; hash: string; txHash?: string } | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'wallet' | 'signing' | 'storing'>('form')

  const {
    isInstalled,
    isConnected,
    account,
    isConnecting,
    error: walletError,
    connect,
    signTransaction,
    clearError,
  } = useMetaMask()

  const [formData, setFormData] = useState({
    patientId: '',
    certificateType: '',
    issuedBy: '',
    issueDate: '',
    expiryDate: '',
    description: '',
  })

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users', { credentials: 'include' })
        const data = await res.json()
        setUsers(data.users || [])
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Clear wallet error after 5 seconds
  useEffect(() => {
    if (walletError) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [walletError, clearError])

  const handleConnectWallet = async () => {
    const connected = await connect()
    if (connected) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(null)

    // Validate form
    if (!formData.patientId || !formData.certificateType || !formData.issuedBy || !formData.issueDate || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    // Check if wallet is connected
    if (!isConnected) {
      setStep('wallet')
      setError('Please connect your MetaMask wallet to sign the transaction')
      return
    }

    setIsSubmitting(true)
    setStep('signing')

    try {
      // Generate a temporary certificate ID for signing
      const tempCertId = `cert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      // Request MetaMask signature
      const signResult = await signTransaction({
        certificateId: tempCertId,
        patientId: formData.patientId,
        certificateType: formData.certificateType,
        issuedBy: formData.issuedBy,
        issueDate: formData.issueDate,
      })

      if (!signResult) {
        setStep('form')
        setError('Transaction was rejected or failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      setStep('storing')

      // Send to backend with the signature
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          walletAddress: account,
          walletSignature: signResult.signature,
          walletTransactionHash: signResult.transactionHash,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create certificate')
        setStep('form')
        return
      }

      setSuccess({
        message: 'Certificate created and stored on blockchain successfully!',
        hash: data.blockchain.hash,
        txHash: signResult.transactionHash,
      })

      // Reset form
      setFormData({
        patientId: '',
        certificateType: '',
        issuedBy: '',
        issueDate: '',
        expiryDate: '',
        description: '',
      })
      setStep('form')
    } catch {
      setError('Failed to create certificate. Please try again.')
      setStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepMessage = () => {
    switch (step) {
      case 'wallet':
        return 'Please connect your MetaMask wallet'
      case 'signing':
        return 'Please confirm the transaction in MetaMask...'
      case 'storing':
        return 'Storing certificate on blockchain...'
      default:
        return ''
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Upload Certificate</h1>
        <p className="text-muted-foreground mt-1">
          Issue a new health certificate and store it on the blockchain
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Wallet Connection Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              MetaMask Wallet
            </CardTitle>
            <CardDescription>
              Connect your MetaMask wallet to sign and verify certificate transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isInstalled ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  MetaMask is not installed.{' '}
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    Install MetaMask
                  </a>
                  {' '}to enable blockchain transactions.
                </AlertDescription>
              </Alert>
            ) : isConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Connected</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-success border-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to issue certificates
                </p>
                <Button 
                  onClick={handleConnectWallet} 
                  disabled={isConnecting}
                  variant="outline"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </div>
            )}
            {walletError && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{walletError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Certificate Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              New Certificate
            </CardTitle>
            <CardDescription>
              Fill in the details below to issue a new health certificate. The certificate will be
              signed with your MetaMask wallet and stored on the blockchain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  <p className="font-medium">{success.message}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-mono break-all">
                      <span className="text-muted-foreground">Blockchain Hash:</span> {success.hash}
                    </p>
                    {success.txHash && (
                      <p className="text-sm font-mono break-all">
                        <span className="text-muted-foreground">Wallet TX:</span> {success.txHash.slice(0, 20)}...
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step !== 'form' && isSubmitting && (
              <Alert className="mb-6 border-primary bg-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <AlertDescription className="text-primary font-medium">
                  {getStepMessage()}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Patient <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Certificate Type <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.certificateType}
                  onValueChange={(value) => setFormData({ ...formData, certificateType: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certificate type" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Issued By <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Hospital or clinic name"
                  value={formData.issuedBy}
                  onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Issue Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Expiry Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Detailed description of the certificate"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Blockchain Storage with MetaMask</p>
                    <p className="text-sm text-muted-foreground">
                      This certificate will be signed with your MetaMask wallet and stored on the blockchain.
                      You will need to confirm the transaction in MetaMask before the certificate is issued.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !isConnected}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {step === 'signing' ? 'Waiting for MetaMask...' : 'Storing on Blockchain...'}
                  </>
                ) : !isConnected ? (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet to Issue
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </>
                )}
              </Button>

              {!isConnected && isInstalled && (
                <p className="text-xs text-center text-muted-foreground">
                  Please connect your MetaMask wallet above to issue certificates
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">How it works</p>
                <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                  <li>Fill in the certificate details</li>
                  <li>Click &quot;Issue Certificate&quot;</li>
                  <li>MetaMask will open asking you to sign the transaction</li>
                  <li>Review and confirm the transaction in MetaMask</li>
                  <li>Certificate is stored on the blockchain after confirmation</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
