'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Eye, ExternalLink, Copy, CheckCircle, Shield, FileCheck } from 'lucide-react'
import { Certificate } from '@/lib/types'
import { downloadCertificatePDF } from '@/lib/pdf-generator'

export default function PatientCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/certificates', { credentials: 'include' })
        const data = await res.json()
        setCertificates(data.certificates || [])
      } catch (error) {
        console.error('Failed to fetch certificates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDownloadPDF = async (cert: Certificate) => {
    setDownloadingId(cert.id)
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300))
      downloadCertificatePDF(cert)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          View, download, and share your health certificates
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Secure PDF Certificates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download your certificates as PDF files with embedded verification data. 
                These PDFs can be verified at any time to prove their authenticity - 
                any tampering will be detected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Certificates</CardTitle>
          <CardDescription>
            Your health certificates stored on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : certificates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-medium">{cert.certificateType}</TableCell>
                    <TableCell>{cert.issuedBy}</TableCell>
                    <TableCell>{formatDate(cert.issueDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={cert.status === 'verified' ? 'default' : 'secondary'}
                        className={
                          cert.status === 'verified'
                            ? 'bg-success text-success-foreground'
                            : cert.status === 'revoked'
                            ? 'bg-destructive text-destructive-foreground'
                            : ''
                        }
                      >
                        {cert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCert(cert)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{selectedCert?.certificateType}</DialogTitle>
                              <DialogDescription>
                                Certificate Details and Blockchain Verification
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCert && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Patient Name</p>
                                    <p className="font-medium">{selectedCert.patientName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedCert.patientEmail}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Issued By</p>
                                    <p className="font-medium">{selectedCert.issuedBy}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Issue Date</p>
                                    <p className="font-medium">{formatDate(selectedCert.issueDate)}</p>
                                  </div>
                                  {selectedCert.expiryDate && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                                      <p className="font-medium">{formatDate(selectedCert.expiryDate)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge
                                      variant={selectedCert.status === 'verified' ? 'default' : 'secondary'}
                                      className={
                                        selectedCert.status === 'verified'
                                          ? 'bg-success text-success-foreground'
                                          : ''
                                      }
                                    >
                                      {selectedCert.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                                  <p className="text-foreground">{selectedCert.description}</p>
                                </div>

                                <div className="bg-muted p-4 rounded-lg space-y-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-success" />
                                    <p className="font-medium text-foreground">Blockchain Verified</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Hash</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs bg-background px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                                        {selectedCert.blockchainHash}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyHash(selectedCert.blockchainHash || '')}
                                      >
                                        {copiedHash ? (
                                          <CheckCircle className="h-4 w-4 text-success" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                                    <code className="text-xs bg-background px-2 py-1 rounded block overflow-hidden text-ellipsis">
                                      {selectedCert.transactionId}
                                    </code>
                                  </div>
                                </div>

                                {/* PDF Download Info */}
                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                      <p className="font-medium text-foreground text-sm">Tamper-Proof PDF</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        The downloaded PDF contains embedded verification data. 
                                        If anyone modifies the PDF, verification will fail.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <Button 
                                    onClick={() => handleDownloadPDF(selectedCert)} 
                                    className="flex-1"
                                    disabled={downloadingId === selectedCert.id}
                                  >
                                    {downloadingId === selectedCert.id ? (
                                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Download PDF Certificate
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      window.open(`/verify?hash=${selectedCert.blockchainHash}`, '_blank')
                                    }
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Verify Link
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDownloadPDF(cert)}
                          disabled={downloadingId === cert.id}
                          title="Download PDF"
                        >
                          {downloadingId === cert.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Certificates Yet</h3>
              <p className="text-muted-foreground">
                Your health certificates will appear here once they are issued.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
