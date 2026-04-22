'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Search, Eye, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Certificate } from '@/lib/types'

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/certificates', { credentials: 'include' })
        const data = await res.json()
        setCertificates(data.certificates || [])
        setFilteredCertificates(data.certificates || [])
      } catch (error) {
        console.error('Failed to fetch certificates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  useEffect(() => {
    const filtered = certificates.filter(
      (cert) =>
        cert.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.issuedBy.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCertificates(filtered)
  }, [searchTerm, certificates])

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const verifiedCount = certificates.filter((c) => c.status === 'verified').length
  const pendingCount = certificates.filter((c) => c.status === 'pending').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Certificates</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all issued health certificates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Certificates
            </CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{certificates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified on Chain
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{verifiedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <FileText className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Certificate Records</CardTitle>
              <CardDescription>
                All certificates stored on blockchain
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredCertificates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cert.patientName}</p>
                        <p className="text-sm text-muted-foreground">{cert.patientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{cert.certificateType}</TableCell>
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
                              Certificate Details and Blockchain Data
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
                                  <p className="font-medium text-foreground">Blockchain Record</p>
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

                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  window.open(`/verify?hash=${selectedCert.blockchainHash}`, '_blank')
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Public Verification Link
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'No certificates have been issued yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
