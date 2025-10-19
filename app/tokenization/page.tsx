'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Shield, FileText, Zap, CheckCircle, Clock, ArrowRight, Sparkles, TrendingUp, Globe, Folder } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { AnimatedThreeTierFilter } from '@/components/tokenization/animated-filter'
import { AdaptiveSchemaForm } from '@/components/tokenization/adaptive-schema-form'
import { CollectionSelector, TokenCollection } from '@/components/tokenization/collection-selector'
import { uploadMetadataToPinata, createCommodityMetadata, NFTMetadata } from '@/lib/services/pinataMetadataService'
import { mintNFTWithHIP412 } from '@/lib/services/nftMintHIP412'
import { setAiGeneratedImageUid } from '@/lib/services/nftMintClientService'
import { generateAssetImage } from '@/lib/n8n-workflows'
import { getOrCreateNFTCollection, getOrCreateUser, createAndMintNFTAsset } from '@/lib/services/nftCollectionClientService'
import { NFTCollectionConfig, NFTAssetConfig } from '@/lib/types/nftTypes'
import { createTokenCollection, CreateTokenConfig } from '@/lib/services/tokenService'
import { useWallet } from '@/hooks/use-wallet'
import { useUserCollections } from '@/hooks/use-user-collections'
import { UserNFTAsset } from '@/lib/services/userNFTService'
import { emergencyWalletReset } from '@/lib/hashconnect'

export default function EnhancedTokenizationPage() {
  const { address: walletAddress, isConnected } = useWallet()
  const { collections, hasCollections, totalCollections, loading: loadingCollections, refetch: refetchCollections } = useUserCollections(walletAddress || undefined)
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
  const [generatingImage, setGeneratingImage] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<TokenCollection | null>(null)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [generatedImageCID, setGeneratedImageCID] = useState<string>('')
  const [userNFTs, setUserNFTs] = useState<UserNFTAsset[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [showCollectionOptions, setShowCollectionOptions] = useState(false)

  const handleFilterChange = useCallback((industry: string, subIndustry: string, specificAsset: string) => {
    setFilterSelection({ industry, subIndustry, specificAsset })
    if (industry && subIndustry && specificAsset) {
      setCurrentStep(2)
    }
  }, [])

  const handleDataChange = (data: any) => {
    setAssetData(data)
  }

  // Fetch user's NFTs
  const fetchUserNFTs = useCallback(async () => {
    if (!walletAddress) return
    
    setLoadingNFTs(true)
    try {
      console.log('📦 Fetching user NFTs for:', walletAddress)
      const response = await fetch(`/api/user-nfts?wallet=${walletAddress}`)
      const data = await response.json()
      
      if (data.success) {
        setUserNFTs(data.assets)
        console.log('✅ Loaded user NFTs:', data.count)
      } else {
        console.error('❌ Failed to fetch NFTs:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching user NFTs:', error)
    } finally {
      setLoadingNFTs(false)
    }
  }, [walletAddress])

  // Load user's NFTs when wallet is connected
  useEffect(() => {
    if (walletAddress && isConnected) {
      fetchUserNFTs()
    }
  }, [walletAddress, isConnected, fetchUserNFTs])

  const handleImagesChange = (images: string[]) => {
    setUploadedImages(images)
  }

  const handleDocumentsChange = (documents: string[]) => {
    setUploadedDocuments(documents)
  }

  const handleCollectionSelect = useCallback((collection: TokenCollection) => {
    setSelectedCollection(collection)
    setCurrentStep(2) // Advance to next step when collection is selected
  }, [])

  const handleCreateNewCollection = useCallback(async (config: CreateTokenConfig) => {
    setIsCreatingCollection(true)
    try {
      console.log('🚀 Creating new token collection:', config)
      
      const result = await createTokenCollection(config)
      
      if (result.success && result.tokenId) {
        // Create new collection object
        const newCollection: TokenCollection = {
          tokenId: result.tokenId,
          name: result.name || config.name,
          symbol: result.symbol || config.symbol,
          category: result.category || config.category,
          assetType: result.assetType || config.assetType,
          maxSupply: result.maxSupply || config.maxSupply,
          description: config.description,
          createdAt: new Date().toISOString(),
          status: 'active'
        }
        
        setSelectedCollection(newCollection)
        setCurrentStep(2) // Advance to next step
        alert(`✅ Collection created successfully! Token ID: ${result.tokenId}`)
      } else {
        throw new Error(result.error || 'Failed to create collection')
      }
    } catch (error) {
      console.error('❌ Failed to create collection:', error)
      alert(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreatingCollection(false)
    }
  }, [])

  // Generate AI image for the asset
  const generateAssetImageForTokenization = async () => {
    const assetName = assetData['asset-name'] || assetData.name
    const assetDescription = assetData['asset-description'] || assetData.description

    if (!assetName || !assetDescription) {
      alert('Please provide asset name and description first')
      return
    }

    setGeneratingImage(true)
    try {
      const result = await generateAssetImage(
        assetName,
        assetDescription,
        `${filterSelection.industry} ${filterSelection.subIndustry} ${filterSelection.specificAsset}`
      )
      setGeneratedImageUrl(result.imageUrl)
      setGeneratedImageCID(result.imageCID)
      
      // Also add to uploaded images for consistency
      setUploadedImages(prev => [result.imageUrl, ...prev])
    } catch (error) {
      console.error('Image generation failed:', error)
      
      // Use a placeholder image based on asset type
      const placeholderImages = {
        'renewable-energy': '/cocoa-beans-agricultural.png',
        'mining': '/copper-ore-mining.png', 
        'agriculture': '/cocoa-beans-agricultural.png',
        'real-estate': '/crystal-glass-bg.png',
        'manufacturing': '/industrial-generator-auction.png',
        'chemicals': '/crystal-glass-bg.png'
      }
      
      const fallbackImage = placeholderImages[filterSelection.industry as keyof typeof placeholderImages] || '/crystal-glass-bg.png'
      
      console.log('🖼️ Using placeholder image:', fallbackImage)
      setGeneratedImageUrl(fallbackImage)
      setGeneratedImageCID('placeholder')
      setUploadedImages(prev => [fallbackImage, ...prev])
      
      alert('AI image generation is temporarily unavailable. Using placeholder image. You can upload your own image if needed.')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleTokenize = async () => {
    // Check wallet connection first
    if (!walletAddress || !isConnected) {
      alert('Please connect your HashPack wallet first to mint NFT tokens')
      return
    }

    if (!filterSelection.industry || !filterSelection.subIndustry || !filterSelection.specificAsset) {
      alert('Please complete asset selection first')
      return
    }

    // Ensure we have asset name and description from the form
    const assetName = assetData['asset-name'] || assetData.name || `${filterSelection.specificAsset} Token`
    const assetDescription = assetData['asset-description'] || assetData.description || `Tokenized ${filterSelection.specificAsset}`

    if (!assetName || !assetDescription) {
      alert('Please provide asset name and description in the form')
      return
    }

    setIsTokenizing(true)
    setCurrentStep(3)

    try {
      // Step 1: Create or get user record
      console.log('👤 Creating/getting user record...')
      console.log('👤 Wallet address:', walletAddress)
      
      let userResult
      try {
        userResult = await getOrCreateUser(walletAddress) // Removed hardcoded businessId
      } catch (fetchError) {
        console.error('❌ Network error when creating user:', fetchError)
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`)
      }
      
      console.log('👤 User result:', userResult)
      if (!userResult) {
        throw new Error('Failed to create user: No response from server')
      }
      if (!userResult.success) {
        throw new Error(`Failed to create user: ${userResult.error || 'Unknown error'}`)
      }
      const user = userResult.user!

      // Step 2: Handle image selection (uploaded vs AI generated)
      console.log('🎨 Checking for AI generated image...')
      let imageUrl = uploadedImages[0] || '' // Always prioritize uploaded images
      let aiImageCID = '' // For future AI pipeline
      
      // Future AI image generation logic (currently disabled)
      if (!imageUrl && assetName && assetDescription && false) { // Set to false to disable for now
        setGeneratingImage(true)
        try {
          console.log('🤖 AI image generation pipeline not configured yet - skipping')
          // TODO: Enable when AI image generation pipeline is ready
          /*
          const result = await generateAssetImage(
            assetName,
            assetDescription,
            `${filterSelection.industry} ${filterSelection.subIndustry} ${filterSelection.specificAsset}`
          )
          imageUrl = result.imageUrl
          setGeneratedImageUrl(result.imageUrl)
          aiImageCID = result.imageCID
          setGeneratedImageCID(result.imageCID)
          console.log('✅ AI image generated successfully:', result.imageUrl)
          
          // Store AI image UID in database when pipeline is ready
          await setAiGeneratedImageUid(result.imageCID)
          */
        } catch (imageError) {
          console.warn('AI image generation failed, proceeding without image:', imageError)
        } finally {
          setGeneratingImage(false)
        }
      }

      // Use uploaded image if available, otherwise fallback to AI generated (when available)
      if (!imageUrl && generatedImageUrl) {
        imageUrl = generatedImageUrl
        aiImageCID = generatedImageCID
      }

      // Step 3: Create or get NFT collection for this asset type
      console.log('📚 Creating/getting NFT collection...')
      const collectionConfig: NFTCollectionConfig = {
        name: `${filterSelection.specificAsset} Collection`,
        symbol: filterSelection.specificAsset.substring(0, 4).toUpperCase(),
        description: `Collection for ${filterSelection.specificAsset} assets`,
        category: filterSelection.industry,
        assetType: filterSelection.specificAsset,
        maxSupply: 1000000,
        businessId: user.businessId!, // Now guaranteed to exist from getOrCreateUser
        createdBy: walletAddress
      }
      console.log('📚 Collection config:', collectionConfig)

      const collectionResult = await getOrCreateNFTCollection(collectionConfig)
      console.log('📚 Collection result:', collectionResult)
      if (!collectionResult.success) {
        throw new Error(`Failed to create collection: ${collectionResult.error}`)
      }
      const collection = collectionResult.collection!

      // Step 4: Create NFT metadata
      console.log('📝 Creating NFT metadata...')
      const metadata: NFTMetadata = createCommodityMetadata(
        {
          name: assetName,
          description: assetDescription,
          category: filterSelection.industry,
          commodityType: filterSelection.specificAsset,
          quantity: assetData.quantity || assetData['total-acreage'] || assetData['total-area'] || assetData['estimated-reserves'] || assetData['estimated-tonnage'] || 1,
          unit: assetData.unit || assetData['unit-types'] || 'units',
          quality: assetData.quality || assetData['ore-grade'] || assetData['copper-grade'] || assetData['soil-quality'] || assetData['condition'],
          location: assetData.location || assetData['site-location'] || assetData['farm-location'] || assetData['property-address'],
          certifications: assetData.certifications || assetData['environmental-permits'] || assetData['certifications'] || [],
          businessId: user.businessId!, // Now guaranteed to exist from getOrCreateUser
          auctionId: undefined
        },
        imageUrl
      )

      // Step 5: Upload metadata to IPFS
      console.log('📤 Uploading metadata to IPFS...')
      const ipfsHash = await uploadMetadataToPinata(metadata)

      // Step 6: Create NFT asset record in database
      console.log('💾 Creating NFT asset in database...')
      const assetConfig: NFTAssetConfig = {
        name: assetName,
        description: assetDescription,
        collectionId: collection.id,
        assetData: assetData,
        quantity: assetData.quantity,
        unit: assetData.unit,
        quality: assetData.quality,
        location: assetData.location,
        certifications: assetData.certifications,
        imageUrl: imageUrl, // Uploaded image or AI generated (prioritizes uploaded)
        aiImageUrl: generatedImageUrl, // AI generated image URL (for future use)
        aiImageCID: aiImageCID, // AI generated image CID (for future database storage)
        documentUrls: uploadedDocuments,
        metadataUri: `ipfs://${ipfsHash}`,
        metadataHash: ipfsHash,
        createdBy: walletAddress,
        ownerId: user.businessId! // Now guaranteed to exist from getOrCreateUser
      }

      const assetResult = await createAndMintNFTAsset(assetConfig)
      if (!assetResult.success) {
        throw new Error(`Failed to create NFT asset: ${assetResult.error}`)
      }

      // Step 7: Mint NFT using HashConnect (REAL MINTING!)
      console.log('🔨 Minting NFT on Hedera with HashConnect...')
      console.log('🚨 This will prompt your HashPack wallet!')
      
      // Ensure HashConnect is properly initialized before minting
      console.log('🔄 Ensuring HashConnect is initialized...')
      const { initHashConnect, getHashConnectInstance } = await import('@/lib/hashconnect')
      await initHashConnect()
      
      // Double-check that HashConnect is ready
      const hashConnectInstance = getHashConnectInstance()
      if (!hashConnectInstance) {
        throw new Error('Failed to initialize HashConnect. Please refresh the page and try again.')
      }
      
      console.log('✅ HashConnect is ready, proceeding with minting...')
      
      const mintConfig = {
        name: assetName,
        description: `Tokenized ${assetName}`,
        imageUrl: uploadedImages[0] || '',
        metadataUri: `ipfs://${ipfsHash}`,
        metadataHash: ipfsHash,
        collectionId: collection.id,
        assetData: assetData,
        treasuryId: walletAddress, // Connected wallet account ID
        createdBy: walletAddress   // Connected wallet account ID
      }

      const mintResult = await mintNFTWithHIP412(mintConfig)

      if (mintResult.success) {
        setCurrentStep(4)
        setIsTokenizing(false)
        
        // Refresh the NFT list to show the new NFT
        await fetchUserNFTs()
        
        // Show success message with NFT details
        alert(`🎊 NFT Created Successfully!\n\nAsset: "${assetName}"\nCollection: "${collection.name}"\nSerial #: ${assetResult.serialNumber}\nWallet: ${walletAddress}\nToken ID: ${mintResult.tokenId}\nIPFS Hash: ${ipfsHash}\n\n✅ Your NFT has been minted and should appear in your HashPack wallet!\n\n🎉 Check your wallet to see your new NFT!`)
        
        console.log('🎉 NFT created successfully:', {
          asset: assetResult,
          mint: mintResult,
          collection: collection
        })
      } else {
        throw new Error(`NFT minting failed: ${mintResult.error}`)
      }

    } catch (error) {
      console.error('❌ Tokenization failed:', error)
      alert(`Tokenization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsTokenizing(false)
      setGeneratingImage(false)
    }
  }

  const handleNFTMint = async () => {
    // Check wallet connection first
    if (!walletAddress || !isConnected) {
      alert('Please connect your HashPack wallet first to mint NFTs')
      return
    }

    setIsTokenizing(true)

    try {
      console.log('🎨 Starting HIP-412 compliant NFT minting...')
      
      // Import the HIP-412 service
      const { mintNFTWithHIP412 } = await import('@/lib/services/nftMintHIP412')
      
      // Use user's actual data if available, otherwise fallback to defaults
      const assetName = assetData['asset-name'] || assetData.name || 'HederaB2B NFT'
      const assetDescription = assetData['asset-description'] || assetData.description || 'Professional NFT created using the HIP-412 Token Metadata JSON Schema V2 standard with IPFS storage and full Hedera compliance.'
      const imageUrl = uploadedImages[0] || generatedImageUrl || '/crystal-glass-bg.png' // Use local image as fallback
      
      console.log('🖼️ Using image URL:', imageUrl);
      console.log('📋 Asset data:', { assetName, assetDescription, imageUrl });
      
      const mintRequest = {
        name: assetName,
        symbol: 'HB2B',
        description: assetDescription,
        imageUrl: imageUrl,
        treasuryId: walletAddress,
        creator: 'HederaB2B Marketplace',
        testMode: true,
        attributes: [
          {
            trait_type: 'Standard',
            value: 'HIP-412'
          },
          {
            trait_type: 'Version',
            value: '2.0.0'
          },
          {
            trait_type: 'Type',
            value: 'Asset Token'
          },
          // Add user's specific asset data as attributes if available
          ...(filterSelection.industry ? [{
            trait_type: 'Industry',
            value: filterSelection.industry
          }] : []),
          ...(filterSelection.subIndustry ? [{
            trait_type: 'Sub Industry',
            value: filterSelection.subIndustry
          }] : []),
          ...(filterSelection.specificAsset ? [{
            trait_type: 'Asset Type',
            value: filterSelection.specificAsset
          }] : []),
          ...(assetData.quantity ? [{
            trait_type: 'Quantity',
            value: assetData.quantity,
            display_type: 'number' as const
          }] : []),
          ...(assetData.quality || assetData['ore-grade'] || assetData['soil-quality'] ? [{
            trait_type: 'Quality',
            value: assetData.quality || assetData['ore-grade'] || assetData['soil-quality']
          }] : [])
        ],
        properties: {
          external_url: 'https://localhost:3000/marketplace',
          category: filterSelection.industry || 'Digital Assets',
          blockchain: 'Hedera Hashgraph',
          location: assetData.location || assetData['site-location'] || assetData['farm-location'] || assetData['property-address'],
          unit: assetData.unit || assetData['unit-types'],
          documentUrls: uploadedDocuments.length > 0 ? uploadedDocuments : undefined // Add uploaded documents
        }
      }

      const result = await mintNFTWithHIP412(mintRequest)

      if (result.success) {
        alert(`✅ NFT Created Successfully!\n\nToken ID: ${result.tokenId}\nSerial Number: ${result.serialNumber}\nTransaction ID: ${result.transactionId}\nMetadata URI: ${result.metadataUri}\n\n🏛️ HIP-412 compliant with IPFS metadata!\n🎉 Check HashScan for details!`)
        console.log('✅ NFT created:', result)
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('❌ NFT minting failed:', error)
      alert(`NFT minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTokenizing(false)
    }
  }

  const tokenizedAssets = [
    {
      id: 1,
      title: "Copper Ore Token #001",
      description: "Industrial grade copper ore 99.8% purity",
      tokenSupply: "1,000,000",
      tokenPrice: "ℏ0.0024",
      totalValue: "ℏ2,400",
      status: "active",
      holders: 127,
      tradingVolume: "ℏ156",
      image: "/copper-ore-tokenized-asset.png",
    },
    {
      id: 2,
      title: "Cocoa Beans Token #002",
      description: "50 tons organic fair trade cocoa",
      tokenSupply: "500,000",
      tokenPrice: "ℏ0.0037",
      totalValue: "ℏ1,850",
      status: "active",
      holders: 32,
      tradingVolume: "ℏ89",
      image: "/cocoa-beans-tokenized.png",
    },
    {
      id: 3,
      title: "Gold Mining Rights Token",
      description: "5-year exclusive mining rights",
      tokenSupply: "10,000,000",
      tokenPrice: "ℏ0.0005",
      totalValue: "ℏ5,000",
      status: "pending",
      holders: 0,
      tradingVolume: "ℏ0",
      image: "/gold-mining-rights-token.png",
    },
  ]

  // Calculate step status based on actual state
  const getStepStatus = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: // Collection Setup
        return selectedCollection ? "completed" : "in-progress"
      case 2: // Asset Verification & Legal Compliance
        if (!selectedCollection) return "pending"
        return (filterSelection.industry && filterSelection.subIndustry && filterSelection.specificAsset) ? "completed" : 
               currentStep >= 2 ? "in-progress" : "pending"
      case 3: // Token Creation
        if (!selectedCollection || !filterSelection.specificAsset) return "pending"
        return currentStep > 3 ? "completed" : currentStep === 3 ? "in-progress" : "pending"
      case 4: // Market Launch
        if (!selectedCollection || !filterSelection.specificAsset) return "pending"
        return currentStep > 4 ? "completed" : currentStep === 4 ? "in-progress" : "pending"
      default:
        return "pending"
    }
  }

  const tokenizationSteps = [
    {
      step: 1,
      title: "Collection Setup",
      description: "Select existing collection or create new token collection",
      icon: Folder,
      status: getStepStatus(1),
    },
    {
      step: 2,
      title: "Asset Verification & Legal Compliance",
      description: "Physical asset inspection, documentation and regulatory approval",
      icon: Shield,
      status: getStepStatus(2),
    },
    {
      step: 3,
      title: "Token Creation",
      description: "Smart contract deployment on Hedera blockchain",
      icon: Zap,
      status: getStepStatus(3),
    },
    {
      step: 4,
      title: "Market Launch",
      description: "Token listing and trading activation",
      icon: TrendingUp,
      status: getStepStatus(4),
    },
  ]

  return (
    <div className="min-h-screen relative">
      <Navigation />
      
      {/* Crystal Glass Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/crystal-glass-bg.png)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]"></div>
      </div>
      
      <div className="relative overflow-hidden z-10">
        {/* Additional subtle overlays for content areas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 text-blue-700 rounded-full text-sm font-medium mb-6 shadow-lg">
              <Shield className="w-4 h-4 mr-2" />
              Powered by Hedera Blockchain
            </div>
            <h1 className="text-5xl font-bold mb-6 relative">
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-lg">
                Unlock Liquidity in Real-World Assets
              </span>
            </h1>
            <p className="text-xl text-gray-800 max-w-4xl mx-auto leading-relaxed mb-16 drop-shadow-md bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              Transform physical commodities into digital tokens, enabling fractional ownership,
              enhanced liquidity, and transparent trading on the blockchain.
            </p>
          </div>

          {/* Tokenization Process - Moved up */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Tokenization Process</h3>
            
            <div className="grid md:grid-cols-4 gap-6 relative">
              {tokenizationSteps.map((step, index) => (
                <Card key={step.step} className={`relative transition-all duration-500 bg-white/70 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl ${
                  step.status === 'completed' ? 'border-green-200 bg-green-50/40' :
                  step.status === 'in-progress' ? 'border-blue-200 bg-blue-50/40 transform scale-105' :
                  'hover:border-gray-300/70'
                }`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
                      step.status === 'completed' ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/25' :
                      step.status === 'in-progress' ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/25' :
                      'bg-gray-100/80 text-gray-500 border border-gray-200'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : step.status === 'in-progress' ? (
                        <div className="relative">
                          <Clock className="w-8 h-8" />
                          <div className="absolute inset-0 animate-spin">
                            <div className="w-8 h-8 border-2 border-transparent border-t-white rounded-full"></div>
                          </div>
                        </div>
                      ) : (
                        <step.icon className="w-8 h-8" />
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">Step {step.step}</CardTitle>
                    <CardTitle className="text-base font-medium text-gray-700">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <CardDescription className="text-sm text-gray-600">{step.description}</CardDescription>
                  </CardContent>
                  
                  {/* Arrow between steps */}
                  {index < tokenizationSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Tokenization Form Section */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Side - Filters */}
            <div className="space-y-8">
              <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">Select Your Asset</CardTitle>
                  <CardDescription className="text-gray-600">
                    Choose the type of asset you want to tokenize using our intelligent filter system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatedThreeTierFilter 
                    onSelectionChange={handleFilterChange}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Form */}
            <div className="space-y-8">
              {filterSelection.industry && filterSelection.subIndustry && filterSelection.specificAsset ? (
                <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Asset Details</CardTitle>
                    <CardDescription className="text-gray-600">
                      Provide detailed information about your {filterSelection.specificAsset}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AdaptiveSchemaForm
                      industryId={filterSelection.industry}
                      subIndustryId={filterSelection.subIndustry}
                      specificAsset={filterSelection.specificAsset}
                      onDataChange={handleDataChange}
                      onImagesChange={handleImagesChange}
                      onDocumentsChange={handleDocumentsChange}
                    />

                    {/* AI Image Generation Section */}
                    {(assetData['asset-name'] || assetData.name) && (assetData['asset-description'] || assetData.description) && (
                      <div className="mt-6 p-4 bg-purple-50/80 backdrop-blur-sm rounded-lg border border-purple-200/50">
                        <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2" />
                          AI Asset Image Generation
                        </h4>
                        
                        {generatedImageUrl ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={generatedImageUrl}
                                alt="Generated asset image"
                                className="w-full h-48 object-cover rounded-lg border shadow-sm"
                              />
                              <button
                                onClick={() => {
                                  setGeneratedImageUrl('')
                                  setUploadedImages(prev => prev.filter(img => img !== generatedImageUrl))
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-sm text-purple-700">
                              ✨ AI generated image based on: "{assetData['asset-name'] || assetData.name}" - {assetData['asset-description'] || assetData.description}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-purple-700">
                              Generate a custom image for your "{assetData['asset-name'] || assetData.name}" asset using AI
                            </p>
                            <Button
                              onClick={generateAssetImageForTokenization}
                              disabled={generatingImage}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {generatingImage ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Generating AI Image...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Generate AI Image
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collection Management Section */}
                    {walletAddress && isConnected && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-lg border border-blue-200/50">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                          <Folder className="w-5 h-5 mr-2" />
                          Token Collection Management
                        </h4>
                        
                        {loadingCollections ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-blue-700">Checking your collections...</span>
                          </div>
                        ) : hasCollections ? (
                          <div className="space-y-4">
                            <div className="bg-green-50/80 border border-green-200/50 rounded-lg p-3">
                              <div className="flex items-center mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                <span className="font-medium text-green-800">
                                  You have {totalCollections} existing collection{totalCollections > 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-sm text-green-700 mb-3">
                                You can mint new tokens to your existing collections or create a new one.
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                              {collections.map((collection) => (
                                <div
                                  key={collection.id}
                                  className="flex items-center justify-between p-2 bg-white/60 border border-gray-200/50 rounded-md hover:bg-white/80 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {collection.name}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                      {collection.symbol} • {collection.currentSupply}/{collection.maxSupply} minted
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={collection.hasSupplyKey ? "default" : "secondary"} className="text-xs">
                                      {collection.hasSupplyKey ? "Ready" : "No Key"}
                                    </Badge>
                                    {collection.hasSupplyKey && !collection.supplyKeyDisplayed && (
                                      <Badge variant="destructive" className="text-xs">
                                        Key Hidden
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                                onClick={() => setShowCollectionOptions(!showCollectionOptions)}
                              >
                                {showCollectionOptions ? 'Hide Options' : 'Show Options'}
                              </Button>
                            </div>
                            
                            {showCollectionOptions && (
                              <div className="space-y-2 pt-2 border-t border-blue-200/50">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-green-700 border-green-200 hover:bg-green-50"
                                >
                                  Mint to Existing Collection
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-purple-700 border-purple-200 hover:bg-purple-50"
                                >
                                  Create New Collection
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-yellow-50/80 border border-yellow-200/50 rounded-lg p-3">
                              <div className="flex items-center mb-2">
                                <Sparkles className="w-5 h-5 text-yellow-600 mr-2" />
                                <span className="font-medium text-yellow-800">
                                  First time tokenizing?
                                </span>
                              </div>
                              <p className="text-sm text-yellow-700">
                                We'll create your first token collection automatically. You'll receive a supply key that lets you mint unlimited tokens.
                              </p>
                            </div>
                            
                            <div className="bg-blue-50/80 border border-blue-200/50 rounded-lg p-3">
                              <div className="flex items-center mb-2">
                                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="font-medium text-blue-800">
                                  Important: Secure Key Storage
                                </span>
                              </div>
                              <p className="text-sm text-blue-700">
                                Your supply key will be shown ONCE and stored securely. Save it safely - you'll need it to mint more tokens later.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-center gap-4 mt-8">
                      {/* <Button
                        onClick={handleTokenize}
                        disabled={isTokenizing || generatingImage}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                      >
                        {isTokenizing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {generatingImage ? 'Generating Image...' : 'Tokenizing Asset...'}
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            Tokenize Asset
                          </>
                        )}
                      </Button> */}
                      
                      <Button
                        onClick={handleNFTMint}
                        disabled={isTokenizing || generatingImage}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                      >
                        {isTokenizing ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                            Minting NFT...
                          </>
                        ) : (
                          <>
                            <Zap className="w-6 h-6 mr-3" />
                            🏛️ Mint HIP-412 NFT
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-gray-300/50 bg-white/40 backdrop-blur-sm shadow-sm">
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

          {/* Active Tokens */}
          <div className="mb-16 mt-32">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Active Tokenized Assets</h3>
              <Button variant="outline" className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white/90 shadow-lg">
                View All Tokens
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingNFTs ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your NFTs...</p>
                  </div>
                </div>
              ) : userNFTs.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No NFTs Yet</h3>
                    <p className="text-gray-500">Create your first tokenized asset to see it here!</p>
                  </div>
                </div>
              ) : (
                userNFTs.map((asset) => (
                  <Card key={asset.id} className="bg-white/80 backdrop-blur-md border border-white/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group shadow-xl">
                    <div className="aspect-video bg-gray-50/80 rounded-t-lg overflow-hidden relative">
                      <img
                        src={asset.imageUrl || asset.aiImageUrl || "/placeholder.svg"}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge
                        className={`absolute top-3 left-3 shadow-sm ${
                          asset.status === "ACTIVE" ? "bg-green-500/90 text-white backdrop-blur-sm" : "bg-yellow-500/90 text-white backdrop-blur-sm"
                        }`}
                      >
                        {asset.status === "ACTIVE" ? "ACTIVE" : "PENDING"}
                      </Badge>
                      {asset.tokenId && (
                        <Badge className="absolute top-3 right-3 bg-blue-500/90 text-white backdrop-blur-sm shadow-sm">
                          #{asset.serialNumber}
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold text-gray-900">{asset.name}</CardTitle>
                      <CardDescription className="text-gray-600">{asset.description}</CardDescription>
                      <div className="text-xs text-gray-500 mt-1">
                        Collection: {asset.collection.name} ({asset.collection.symbol})
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">Token ID</span>
                          <p className="font-semibold text-gray-900">{asset.tokenId || 'Pending'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Serial Number</span>
                          <p className="font-semibold text-gray-900">#{asset.serialNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Category</span>
                          <p className="font-semibold text-gray-900">{asset.collection.category}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Asset Type</span>
                          <p className="font-semibold text-green-600">{asset.collection.assetType}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">Created</span>
                          <p className="font-semibold text-gray-900">
                            {new Date(asset.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-sm">
                          <Coins className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm border-gray-200/50 hover:bg-white">
                          Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Benefits of Asset Tokenization
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Enhanced Liquidity</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Convert illiquid assets into tradeable tokens, enabling 24/7 trading and fractional ownership.
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Blockchain Security</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Immutable ownership records and transparent transaction history on Hedera blockchain.
                  </p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Coins className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Fractional Ownership</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Enable multiple investors to own portions of high-value assets through token fractionalization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Reset Button - Only show if there have been connection issues */}
        {isConnected && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={emergencyWalletReset}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
            >
              🚨 Emergency Wallet Reset (if experiencing connection issues)
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Click this if you're experiencing persistent wallet connection or transaction failures
            </p>
          </div>
        )}
      </div>
    </div>
  )
}