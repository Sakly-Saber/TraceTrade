'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { DocumentUpload } from '@/components/document-upload'
import { useAuth } from '@/contexts/auth-context'
import { useWallet } from '@/hooks/use-wallet'

interface DocumentFile {
  id: string
  file: File
  type: string
  description: string
  preview?: string
  status: 'uploading' | 'uploaded' | 'error'
  error?: string
}

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { isConnected, connect, address, walletType, walletTypeForDB } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [signupMode, setSignupMode] = useState<'traditional' | 'wallet'>('traditional')

  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    website: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    registrationNumber: '',
    taxId: '',
    businessType: '',
    industry: '',
    foundedYear: '',
    employeeCount: '',
    annualRevenue: '',
    
    // Primary User Information
    firstName: '',
    lastName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Wallet Information
    walletAddress: '',
    walletType: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDocumentsChange = (newDocuments: DocumentFile[]) => {
    setDocuments(newDocuments)
  }

  // Auto-fill wallet information when wallet is connected
  useEffect(() => {
    if (isConnected && address && signupMode === 'wallet') {
      setFormData(prev => ({
        ...prev,
        walletAddress: address,
        walletType: walletTypeForDB || ''
      }))
    }
  }, [isConnected, address, walletTypeForDB, signupMode])

  const uploadDocuments = async (businessId: string, token: string) => {
    const uploadPromises = documents.map(async (doc) => {
      const formData = new FormData()
      formData.append('file', doc.file)
      formData.append('type', doc.type)
      formData.append('description', doc.description)
      formData.append('businessId', businessId)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to upload ${doc.file.name}`)
      }

      return response.json()
    })

    return await Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate required fields (more flexible for wallet signup)
    const baseRequiredFields = [
      'businessName', 'businessEmail', 'firstName', 'lastName', 
      'userEmail', 'password'
    ]
    
    const traditionalRequiredFields = [
      'businessPhone', 'address', 'city', 'state'
    ]

    const requiredFields = signupMode === 'wallet' && isConnected 
      ? baseRequiredFields 
      : [...baseRequiredFields, ...traditionalRequiredFields]

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setError(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`)
        setLoading(false)
        return
      }
    }

    // For wallet mode, require wallet connection
    if (signupMode === 'wallet' && !isConnected) {
      setError('Please connect your wallet to continue with wallet signup')
      setLoading(false)
      return
    }

    // Validate documents (ensure all have types selected)
    const incompleteDocuments = documents.filter(doc => !doc.type || doc.status !== 'uploaded')
    if (incompleteDocuments.length > 0) {
      setError('Please complete all document uploads by selecting document types')
      setLoading(false)
      return
    }

    try {
      // First, register the business
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Upload documents if any
      if (documents.length > 0) {
        try {
          await uploadDocuments(data.business.id, data.token)
        } catch (uploadError) {
          console.warn('Document upload failed:', uploadError)
          // Don't fail the registration for document upload issues
        }
      }

      // Store token and user data using auth context
      login(data.token, data.user)

      setSuccess('Business registered successfully! Redirecting to dashboard...')
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Registration</h1>
          <p className="text-gray-600 mt-2">Join the Hedera B2B Marketplace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register Your Business</CardTitle>
            <CardDescription>
              Fill in the details below to create your business account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Signup Mode Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Choose Signup Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={signupMode === 'traditional' ? 'default' : 'outline'}
                  onClick={() => setSignupMode('traditional')}
                  className="w-full"
                >
                  Traditional Signup
                </Button>
                <Button
                  type="button"
                  variant={signupMode === 'wallet' ? 'default' : 'outline'}
                  onClick={() => setSignupMode('wallet')}
                  className="w-full"
                >
                  Connect Wallet & Signup
                </Button>
              </div>
            </div>

            {/* Wallet Connection Section */}
            {signupMode === 'wallet' && (
              <div className="mb-6 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Wallet Connection</h4>
                  <p className="text-blue-700 mb-4">
                    Connect your wallet to automatically fill in some information
                  </p>
                  {!isConnected ? (
                    <Button onClick={connect} className="mb-3">
                      Connect Wallet
                    </Button>
                  ) : (
                    <div className="text-green-700">
                      <p className="font-medium">✓ Wallet Connected</p>
                      <p className="text-sm">
                        {address?.slice(0, 6)}...{address?.slice(-4)} ({walletType === 'hashconnect' ? 'HashPack' : 'MetaMask'})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  {success}
                </Alert>
              )}

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Enter business name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="businessEmail">Business Email *</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                      placeholder="business@company.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="businessPhone">
                      Business Phone {signupMode === 'traditional' || !isConnected ? '*' : '(Optional)'}
                    </Label>
                    <Input
                      id="businessPhone"
                      value={formData.businessPhone}
                      onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                      placeholder="+234 800 000 0000"
                      required={signupMode === 'traditional' || !isConnected}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.company.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your business..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                        <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                        <SelectItem value="LIMITED_LIABILITY">Limited Liability</SelectItem>
                        <SelectItem value="CORPORATION">Corporation</SelectItem>
                        <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
                        <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AGRICULTURE">Agriculture</SelectItem>
                        <SelectItem value="MINING">Mining</SelectItem>
                        <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                        <SelectItem value="ENERGY">Energy</SelectItem>
                        <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                        <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                        <SelectItem value="FINANCE">Finance</SelectItem>
                        <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                        <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                        <SelectItem value="RETAIL">Retail</SelectItem>
                        <SelectItem value="SERVICES">Services</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Address Information
                  {signupMode === 'wallet' && isConnected && (
                    <span className="text-sm font-normal text-blue-600 ml-2">(Optional with wallet signup)</span>
                  )}
                </h3>
                
                <div>
                  <Label htmlFor="address">
                    Address {signupMode === 'traditional' || !isConnected ? '*' : '(Optional)'}
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address"
                    required={signupMode === 'traditional' || !isConnected}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">
                      City {signupMode === 'traditional' || !isConnected ? '*' : '(Optional)'}
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      required={signupMode === 'traditional' || !isConnected}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">
                      State {signupMode === 'traditional' || !isConnected ? '*' : '(Optional)'}
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      required={signupMode === 'traditional' || !isConnected}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="Postal code"
                    />
                  </div>
                </div>
              </div>

              {/* Primary User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Primary Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="First name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Last name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="userEmail">Email *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={formData.userEmail}
                      onChange={(e) => handleInputChange('userEmail', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
                <DocumentUpload
                  onDocumentsChange={handleDocumentsChange}
                  maxFiles={5}
                  maxFileSize={10}
                  acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                  required={false}
                />
              </div>

              {/* Wallet Information Summary */}
              {signupMode === 'wallet' && isConnected && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Wallet Information</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Wallet Address:</strong> {address}</p>
                    <p><strong>Wallet Type:</strong> {walletType === 'hashconnect' ? 'HashPack' : 'MetaMask'}</p>
                    <p className="text-xs mt-2 text-green-600">
                      ✓ This information will be automatically saved to your business profile
                    </p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Register Business'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}