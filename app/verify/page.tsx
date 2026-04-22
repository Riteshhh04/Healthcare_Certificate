'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ArrowLeft,
  Upload,
  AlertTriangle,
  FileWarning,
  Search,
  Hash,
} from 'lucide-react'

interface PDFVerificationResult {
  isValid: boolean
  isTampered: boolean
  certificate?: {
    id: string
    patient: string
    type: string
    issuer: string
    date: string
    hash: string
  }
  originalCertificate?: {
    id: string
    patientName: string
    certificateType: string
    issuedBy: string
    issueDate: string
    expiryDate?: string
    description: string
    status: string
  }
  message: string
  details: string[]
}

interface HashVerificationResult {
  isValid: boolean
  certificate?: {
    id: string
    patientName: string
    certificateType: string
    issuedBy: string
    issueDate: string
    expiryDate?: string
    description: string
    status: string
  }
  blockchain?: {
    hash: string
    transactionId?: string
    blockNumber?: number
    timestamp?: string
  }
  message: string
  error?: string
}

function VerifyPageContent() {
  // PDF verification state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isPdfVerifying, setIsPdfVerifying] = useState(false)
  const [pdfResult, setPdfResult] = useState<PDFVerificationResult | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Hash verification state
  const [hashInput, setHashInput] = useState('')
  const [isHashVerifying, setIsHashVerifying] = useState(false)
  const [hashResult, setHashResult] = useState<HashVerificationResult | null>(null)
  const [hashError, setHashError] = useState('')

  const handlePdfVerify = async () => {
    if (!pdfFile) {
      setPdfError('Please select a PDF file')
      return
    }

    setPdfError('')
    setPdfResult(null)
    setIsPdfVerifying(true)

    try {
      const formData = new FormData()
      formData.append('pdf', pdfFile)

      const res = await fetch('/api/certificates/verify-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setPdfResult(data)
    } catch {
      setPdfError('PDF verification failed. Please try again.')
    } finally {
      setIsPdfVerifying(false)
    }
  }

  const handleHashVerify = async () => {
    const trimmedHash = hashInput.trim()
    if (!trimmedHash) {
      setHashError('Please enter a certificate hash or ID')
      return
    }

    setHashError('')
    setHashResult(null)
    setIsHashVerifying(true)

    try {
      const res = await fetch('/api/certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hash: trimmedHash.startsWith('HCERT-') ? trimmedHash : undefined,
          certificateId: trimmedHash.startsWith('cert-') ? trimmedHash : undefined,
        }),
      })

      const data = await res.json()
      setHashResult(data)
    } catch {
      setHashError('Hash verification failed. Please try again.')
    } finally {
      setIsHashVerifying(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setPdfError('')
      setPdfResult(null)
    } else if (file) {
      setPdfError('Please select a valid PDF file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setPdfError('')
      setPdfResult(null)
    } else {
      setPdfError('Please drop a valid PDF file')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">HealthCert Verify</h1>
              <p className="text-xs text-muted-foreground">Public Verification</p>
            </div>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Verify Health Certificate</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload a certificate PDF or enter a blockchain hash to verify authenticity.
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="hash" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Verify by Hash
            </TabsTrigger>
          </TabsList>

          {/* PDF Upload Tab */}
          <TabsContent value="upload">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  PDF Document Verification
                </CardTitle>
                <CardDescription>
                  Upload a certificate PDF to verify its authenticity and detect any tampering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : pdfFile
                      ? 'border-success bg-success/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {pdfFile ? (
                    <div className="space-y-3">
                      <FileText className="h-12 w-12 text-success mx-auto" />
                      <div>
                        <p className="font-medium text-foreground">{pdfFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(pdfFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPdfFile(null)
                          setPdfResult(null)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium text-foreground">
                          Drop your certificate PDF here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                      />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  {!pdfFile && (
                    <label
                      htmlFor="pdf-upload"
                      className="block mt-4 text-center cursor-pointer"
                    >
                      <Button variant="outline" asChild>
                        <span>
                          <FileText className="h-4 w-4 mr-2" />
                          Browse Files
                        </span>
                      </Button>
                    </label>
                  )}
                </div>

                {pdfError && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{pdfError}</AlertDescription>
                  </Alert>
                )}

                {pdfFile && (
                  <Button
                    onClick={handlePdfVerify}
                    disabled={isPdfVerifying}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {isPdfVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing PDF...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Certificate
                      </>
                    )}
                  </Button>
                )}

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>How it works:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Upload a certificate PDF generated by HealthCert</li>
                    <li>System extracts embedded verification data</li>
                    <li>Compares against original certificate records</li>
                    <li>Detects any modifications or tampering</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* PDF Verification Result */}
            {pdfResult && (
              <Card
                className={
                  pdfResult.isValid
                    ? 'border-success bg-success/5'
                    : pdfResult.isTampered
                    ? 'border-destructive bg-destructive/5'
                    : 'border-warning bg-warning/5'
                }
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {pdfResult.isValid ? (
                      <div className="p-3 bg-success/10 rounded-full">
                        <CheckCircle className="h-8 w-8 text-success" />
                      </div>
                    ) : pdfResult.isTampered ? (
                      <div className="p-3 bg-destructive/10 rounded-full">
                        <FileWarning className="h-8 w-8 text-destructive" />
                      </div>
                    ) : (
                      <div className="p-3 bg-warning/10 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-warning" />
                      </div>
                    )}
                    <div>
                      <CardTitle
                        className={
                          pdfResult.isValid
                            ? 'text-success'
                            : pdfResult.isTampered
                            ? 'text-destructive'
                            : 'text-warning'
                        }
                      >
                        {pdfResult.isValid
                          ? 'Authentic Certificate'
                          : pdfResult.isTampered
                          ? 'Tampered Document Detected'
                          : 'Verification Issue'}
                      </CardTitle>
                      <CardDescription>{pdfResult.message}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge
                      variant={pdfResult.isValid ? 'default' : 'destructive'}
                      className={
                        pdfResult.isValid
                          ? 'bg-success text-success-foreground text-sm px-4 py-1'
                          : 'text-sm px-4 py-1'
                      }
                    >
                      {pdfResult.isValid ? 'AUTHENTIC' : pdfResult.isTampered ? 'FAKE / TAMPERED' : 'UNKNOWN'}
                    </Badge>
                    {pdfResult.isTampered && (
                      <span className="text-destructive font-medium text-sm">
                        This document has been modified after generation
                      </span>
                    )}
                  </div>

                  {(pdfResult.certificate || pdfResult.originalCertificate) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {pdfResult.certificate && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Extracted from PDF
                          </h3>
                          <div className="space-y-3 bg-muted p-4 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Certificate ID</p>
                              <p className="font-medium text-foreground">{pdfResult.certificate.id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Patient Name</p>
                              <p className="font-medium text-foreground">{pdfResult.certificate.patient}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Certificate Type</p>
                              <p className="font-medium text-foreground">{pdfResult.certificate.type}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Issued By</p>
                              <p className="font-medium text-foreground">{pdfResult.certificate.issuer}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {pdfResult.originalCertificate && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Original Record
                          </h3>
                          <div className="space-y-3 bg-muted p-4 rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Certificate ID</p>
                              <p className="font-medium text-foreground">{pdfResult.originalCertificate.id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Patient Name</p>
                              <p className="font-medium text-foreground">{pdfResult.originalCertificate.patientName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Certificate Type</p>
                              <p className="font-medium text-foreground">{pdfResult.originalCertificate.certificateType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge
                                variant="default"
                                className={
                                  pdfResult.originalCertificate.status === 'verified'
                                    ? 'bg-success text-success-foreground'
                                    : ''
                                }
                              >
                                {pdfResult.originalCertificate.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Verification Log</h3>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs space-y-1">
                      {pdfResult.details.map((detail, index) => (
                        <p
                          key={index}
                          className={
                            detail.includes('mismatch') || detail.includes('TAMPERED') || detail.includes('Error')
                              ? 'text-destructive'
                              : detail.includes('verified') || detail.includes('passed')
                              ? 'text-success'
                              : 'text-muted-foreground'
                          }
                        >
                          [{index + 1}] {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Hash Verification Tab */}
          <TabsContent value="hash">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Blockchain Hash Verification
                </CardTitle>
                <CardDescription>
                  Enter a certificate ID or blockchain hash to verify against the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Certificate ID or Blockchain Hash
                    </label>
                    <div className="flex gap-3">
                      <Input
                        placeholder="e.g., cert-1234567890-abc123 or HCERT-00000000..."
                        value={hashInput}
                        onChange={(e) => {
                          setHashInput(e.target.value)
                          setHashError('')
                          setHashResult(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleHashVerify()
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleHashVerify}
                        disabled={isHashVerifying || !hashInput.trim()}
                      >
                        {isHashVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {hashError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{hashError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>How it works:</strong>
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Enter the certificate ID (starts with <code className="bg-background px-1 rounded">cert-</code>)</li>
                      <li>Or enter the blockchain hash (starts with <code className="bg-background px-1 rounded">HCERT-</code>)</li>
                      <li>System verifies against the blockchain records</li>
                      <li>Returns certificate details if valid</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Where to find the hash?
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>The certificate ID is shown on the certificate PDF</li>
                      <li>The blockchain hash is displayed after certificate generation</li>
                      <li>You can find both in the patient or admin dashboard</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hash Verification Result */}
            {hashResult && (
              <Card
                className={
                  hashResult.isValid
                    ? 'border-success bg-success/5'
                    : 'border-destructive bg-destructive/5'
                }
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {hashResult.isValid ? (
                      <div className="p-3 bg-success/10 rounded-full">
                        <CheckCircle className="h-8 w-8 text-success" />
                      </div>
                    ) : (
                      <div className="p-3 bg-destructive/10 rounded-full">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </div>
                    )}
                    <div>
                      <CardTitle
                        className={hashResult.isValid ? 'text-success' : 'text-destructive'}
                      >
                        {hashResult.isValid ? 'Certificate Verified' : 'Verification Failed'}
                      </CardTitle>
                      <CardDescription>{hashResult.message}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={hashResult.isValid ? 'default' : 'destructive'}
                      className={
                        hashResult.isValid
                          ? 'bg-success text-success-foreground text-sm px-4 py-1'
                          : 'text-sm px-4 py-1'
                      }
                    >
                      {hashResult.isValid ? 'VERIFIED' : 'NOT FOUND'}
                    </Badge>
                  </div>

                  {hashResult.certificate && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Certificate Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Certificate ID</p>
                          <p className="font-medium text-foreground">{hashResult.certificate.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Patient Name</p>
                          <p className="font-medium text-foreground">{hashResult.certificate.patientName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Certificate Type</p>
                          <p className="font-medium text-foreground">{hashResult.certificate.certificateType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Issued By</p>
                          <p className="font-medium text-foreground">{hashResult.certificate.issuedBy}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Issue Date</p>
                          <p className="font-medium text-foreground">{hashResult.certificate.issueDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge
                            variant="default"
                            className={
                              hashResult.certificate.status === 'verified'
                                ? 'bg-success text-success-foreground'
                                : ''
                            }
                          >
                            {hashResult.certificate.status}
                          </Badge>
                        </div>
                        {hashResult.certificate.expiryDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">Expiry Date</p>
                            <p className="font-medium text-foreground">{hashResult.certificate.expiryDate}</p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="font-medium text-foreground">{hashResult.certificate.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hashResult.blockchain && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Blockchain Record
                      </h3>
                      <div className="bg-muted p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Blockchain Hash</p>
                          <p className="font-mono text-xs text-foreground break-all">{hashResult.blockchain.hash}</p>
                        </div>
                        {hashResult.blockchain.transactionId && (
                          <div>
                            <p className="text-sm text-muted-foreground">Transaction ID</p>
                            <p className="font-mono text-xs text-foreground">{hashResult.blockchain.transactionId}</p>
                          </div>
                        )}
                        {hashResult.blockchain.blockNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">Block Number</p>
                            <p className="font-medium text-foreground">{hashResult.blockchain.blockNumber}</p>
                          </div>
                        )}
                        {hashResult.blockchain.timestamp && (
                          <div>
                            <p className="text-sm text-muted-foreground">Timestamp</p>
                            <p className="font-medium text-foreground">{hashResult.blockchain.timestamp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            This verification is powered by blockchain technology. Each certificate contains
            embedded verification data that cannot be forged.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  )
}
