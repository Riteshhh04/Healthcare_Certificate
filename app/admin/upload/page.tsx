'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react'

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
  const [success, setSuccess] = useState<{ message: string; hash: string } | null>(null)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create certificate')
        return
      }

      setSuccess({
        message: 'Certificate created and stored on blockchain successfully!',
        hash: data.blockchain.hash,
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
    } catch {
      setError('Failed to create certificate. Please try again.')
    } finally {
      setIsSubmitting(false)
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              New Certificate
            </CardTitle>
            <CardDescription>
              Fill in the details below to issue a new health certificate. The certificate will be
              stored on the Ethereum blockchain for verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  <p className="font-medium">{success.message}</p>
                  <p className="text-sm mt-1 font-mono break-all">
                    Hash: {success.hash}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
                  required
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
                  required
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
                  required
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
                    required
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
                  required
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Blockchain Storage</p>
                    <p className="text-sm text-muted-foreground">
                      This certificate will be hashed and stored on the Ethereum blockchain (Hardhat
                      localhost). The unique hash can be used for verification.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Storing on Blockchain...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
