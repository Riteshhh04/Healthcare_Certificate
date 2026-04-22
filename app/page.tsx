import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Shield,
  CheckCircle,
  FileText,
  Lock,
  ArrowRight,
  Users,
  Search,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">HealthCert Verify</h1>
              <p className="text-xs text-muted-foreground">Blockchain Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/verify">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Shield className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Blockchain-Based Healthcare Certificate Verification
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Secure, tamper-proof health certificates stored on the Ethereum blockchain. Verify
            authenticity instantly with a unique hash.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Search className="h-5 w-5 mr-2" />
                Verify Certificate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Why Choose HealthCert?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Immutable Records</h3>
                <p className="text-muted-foreground">
                  Once stored on the blockchain, certificate data cannot be altered or tampered
                  with, ensuring complete authenticity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Instant Verification</h3>
                <p className="text-muted-foreground">
                  Anyone can verify the authenticity of certificates using the unique blockchain
                  hash without needing an account.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Secure Storage</h3>
                <p className="text-muted-foreground">
                  All certificates are securely hashed and stored on the Ethereum blockchain,
                  providing a permanent record.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Patient Registration</h3>
                <p className="text-muted-foreground">
                  Patients register with email verification to create a secure account for managing
                  their health certificates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Certificate Issuance</h3>
                <p className="text-muted-foreground">
                  Healthcare administrators upload certificates, which are automatically hashed and
                  stored on the Ethereum blockchain.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Public Verification</h3>
                <p className="text-muted-foreground">
                  Anyone can verify a certificate authenticity using the unique hash, without
                  requiring login or registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of healthcare providers using blockchain for certificate verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Credentials */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Demo Credentials
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-background rounded-lg">
                  <p className="font-medium text-foreground mb-2">Patient Login</p>
                  <p className="text-sm text-muted-foreground">Email: john.doe@email.com</p>
                  <p className="text-sm text-muted-foreground">Password: password123</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <p className="font-medium text-foreground mb-2">Admin Login</p>
                  <p className="text-sm text-muted-foreground">Email: admin@healthcare.com</p>
                  <p className="text-sm text-muted-foreground">Password: admin123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">HealthCert Verify</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Blockchain-based healthcare certificate verification system. Built with Next.js,
            Ethereum, and Hardhat.
          </p>
        </div>
      </footer>
    </div>
  )
}
