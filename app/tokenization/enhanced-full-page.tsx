'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Shield, FileText, Zap, CheckCircle, Clock, ArrowRight, Sparkles, TrendingUp, Globe } from "lucide-react"
import { AnimatedThreeTierFilter } from '@/components/tokenization/animated-filter'
import { AdaptiveSchemaForm } from '@/components/tokenization/adaptive-schema-form'
import { uploadEncryptedMetadataToPinata, createAssetMetadata } from '@/lib/services/ipfs-service'

export default function EnhancedTokenizationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [filterSelection, setFilterSelection] = useState({
    industry: '',
    subIndustry: '',
    specificAsset: ''
  })
  const [assetData, setAssetData] = useState<any>({})
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([])
  const [isTokenizing, setIsTokenizing] = useState(false)

  const handleFilterChange = (industry: string, subIndustry: string, specificAsset: string) => {
    setFilterSelection({ industry, subIndustry, specificAsset })
    if (industry && subIndustry && specificAsset) {
      setCurrentStep(2)
    }
  }

  const handleDataChange = (data: any) => {
    setAssetData(data)
  }

  const handleImagesChange = (images: string[]) => {
    setUploadedImages(images)
  }

  const handleDocumentsChange = (documents: string[]) => {
    setUploadedDocuments(documents)
  }

  const handleTokenize = async () => {
    if (!filterSelection.industry || !filterSelection.subIndustry || !filterSelection.specificAsset) {
      alert('Please complete asset selection first')
      return
    }

    setIsTokenizing(true)
    setCurrentStep(3)

    try {
      // Create metadata
      const metadata = createAssetMetadata(
        {
          ...assetData,
          industry: filterSelection.industry,
          subIndustry: filterSelection.subIndustry,
          specificAsset: filterSelection.specificAsset,
          schemaData: assetData
        },
        uploadedImages,
        uploadedDocuments
      )

      // Upload to IPFS with encryption
      const ipfsHash = await uploadEncryptedMetadataToPinata(metadata)
      
      console.log('Asset tokenized successfully!', { ipfsHash, metadata })
      
      // Simulate smart contract deployment
      setTimeout(() => {
        setCurrentStep(4)
        setIsTokenizing(false)
        alert('Asset tokenized successfully!')
      }, 3000)

    } catch (error) {
      console.error('Tokenization failed:', error)
      alert('Tokenization failed. Please try again.')
      setIsTokenizing(false)
    }
  }

  const tokenizedAssets = [
    {
      id: 1,
      title: "Copper Ore Token #001",
      description: "Industrial grade copper ore 99.8% purity",
      tokenSupply: "1,000,000",
      tokenPrice: "$2.45",
      totalValue: "$2,450,000",
      status: "active",
      holders: 127,
      tradingVolume: "$156,000",
      image: "/copper-ore-tokenized-asset.png",
    },
    {
      id: 2,
      title: "Cocoa Beans Token #002",
      description: "50 tons organic fair trade cocoa",
      tokenSupply: "500,000",
      tokenPrice: "$3.78",
      totalValue: "$1,890,000",
      status: "active",
      holders: 32,
      tradingVolume: "$89,000",
      image: "/cocoa-beans-tokenized.png",
    },
    {
      id: 3,
      title: "Gold Mining Rights Token",
      description: "5-year exclusive mining rights",
      tokenSupply: "10,000,000",
      tokenPrice: "$0.50",
      totalValue: "$5,000,000",
      status: "pending",
      holders: 0,
      tradingVolume: "$0",
      image: "/gold-mining-rights-token.png",
    },
  ]

  const tokenizationSteps = [
    {
      step: 1,
      title: "Asset Verification",
      description: "Physical asset inspection and documentation",
      icon: Shield,
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "in-progress" : "pending",
    },
    {
      step: 2,
      title: "Legal Compliance",
      description: "Regulatory approval and legal framework setup",
      icon: Globe,
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "in-progress" : "pending",
    },
    {
      step: 3,
      title: "Token Creation",
      description: "Smart contract deployment on Hedera blockchain",
      icon: Zap,
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "in-progress" : "pending",
    },
    {
      step: 4,
      title: "Market Launch",
      description: "Token listing and trading activation",
      icon: TrendingUp,
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "in-progress" : "pending",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Powered by Hedera Blockchain
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
              Unlock Liquidity in Real-World Assets
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Transform physical commodities into digital tokens, enabling fractional ownership,
              enhanced liquidity, and transparent trading on the blockchain.
            </p>
          </div>

          {/* Tokenization Form Section */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Side - Filters */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Your Asset</h2>
                <p className="text-gray-600 mb-8">
                  Choose the type of asset you want to tokenize using our intelligent filter system.
                </p>
                
                <AnimatedThreeTierFilter 
                  onSelectionChange={handleFilterChange}
                />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="space-y-8">
              {filterSelection.industry && filterSelection.subIndustry && filterSelection.specificAsset ? (
                <>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Asset Details</h2>
                    <p className="text-gray-600 mb-8">
                      Provide detailed information about your {filterSelection.specificAsset}.
                    </p>
                  </div>
                  
                  <AdaptiveSchemaForm
                    industryId={filterSelection.industry}
                    subIndustryId={filterSelection.subIndustry}
                    specificAsset={filterSelection.specificAsset}
                    onDataChange={handleDataChange}
                    onImagesChange={handleImagesChange}
                    onDocumentsChange={handleDocumentsChange}
                  />

                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={handleTokenize}
                      disabled={isTokenizing}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transform transition hover:scale-105"
                    >
                      {isTokenizing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Tokenizing Asset...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Tokenize Asset
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Sparkles className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Select Asset Type</h3>
                    <p className="text-gray-500 text-center">
                      Choose your industry, sub-industry, and specific asset to begin the tokenization process.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Tokenization Process */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Tokenization Process</h3>
            
            <div className="grid md:grid-cols-4 gap-6 relative">
              {tokenizationSteps.map((step, index) => (
                <Card key={step.step} className={`relative transition-all duration-300 backdrop-blur-sm ${
                  step.status === 'completed' ? 'border-green-500 bg-green-50/80' :
                  step.status === 'in-progress' ? 'border-blue-500 bg-blue-50/80 shadow-lg scale-105' :
                  'border-gray-200 bg-white/50 hover:border-gray-300'
                }`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                      step.status === 'completed' ? 'bg-green-500 text-white' :
                      step.status === 'in-progress' ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : step.status === 'in-progress' ? (
                        <Clock className="w-8 h-8" />
                      ) : (
                        <step.icon className="w-8 h-8" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold">Step {step.step}</CardTitle>
                    <CardTitle className="text-base font-medium text-gray-700">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <CardDescription className="text-sm">{step.description}</CardDescription>
                  </CardContent>
                  
                  {/* Arrow between steps */}
                  {index < tokenizationSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Active Tokens */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Active Tokenized Assets</h3>
              <Button variant="outline" className="bg-white/50 backdrop-blur-sm">
                View All Tokens
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokenizedAssets.map((asset) => (
                <Card key={asset.id} className="border-gray-200 hover:shadow-lg transition-all duration-300 bg-white/70 backdrop-blur-sm">
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
                    <img
                      src={asset.image || "/placeholder.svg"}
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className={`absolute top-3 left-3 ${
                        asset.status === "active" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                      }`}
                    >
                      {asset.status === "active" ? "ACTIVE" : "PENDING"}
                    </Badge>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold">{asset.title}</CardTitle>
                    <CardDescription>{asset.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Token Supply</span>
                        <p className="font-semibold">{asset.tokenSupply}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Token Price</span>
                        <p className="font-semibold">{asset.tokenPrice}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Value</span>
                        <p className="font-semibold text-green-600">{asset.totalValue}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Holders</span>
                        <p className="font-semibold">{asset.holders}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Coins className="w-4 h-4 mr-1" />
                        Trade
                      </Button>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Benefits of Asset Tokenization
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Enhanced Liquidity</h4>
                <p className="text-gray-600 leading-relaxed">
                  Convert illiquid assets into tradeable tokens, enabling 24/7 trading and fractional ownership.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Blockchain Security</h4>
                <p className="text-gray-600 leading-relaxed">
                  Immutable ownership records and transparent transaction history on Hedera blockchain.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Coins className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">Fractional Ownership</h4>
                <p className="text-gray-600 leading-relaxed">
                  Enable multiple investors to own portions of high-value assets through token fractionalization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}