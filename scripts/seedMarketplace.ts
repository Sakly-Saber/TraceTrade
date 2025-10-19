import { PrismaClient, BusinessType, Industry, AssetCategory, AssetStatus, CollectionStatus, BusinessStatus, VerificationLevel } from '@prisma/client'

const prisma = new PrismaClient()

const sampleMarketplaceData = [
  {
    // Business 1 - Nigerian Mining Company
    business: {
      name: "Nigeria Copper Mining Co.",
      email: "contact@nigeriamining.com",
      phone: "+234-801-234-5678",
      address: "Mining District, Plateau State",
      city: "Jos",
      state: "Plateau",
      country: "Nigeria",
      businessType: BusinessType.CORPORATION,
      industry: Industry.MINING,
      isVerified: true,
      verificationLevel: VerificationLevel.PREMIUM,
      status: BusinessStatus.ACTIVE,
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678"
    },
    collection: {
      name: "Premium Copper Ore Collection",
      symbol: "COPP",
      description: "High-grade copper ore from Nigerian mines",
      category: AssetCategory.MINING,
      assetType: "Copper Ore",
      maxSupply: 10000,
      status: CollectionStatus.ACTIVE
    },
    asset: {
      name: "Premium Copper Ore NFT",
      description: "Tokenized copper ore mining rights from Nigeria, 100 tons certified",
      assetData: JSON.stringify({
        purity: "25%",
        weight: "100 tons",
        origin: "Nigeria",
        certification: "Mining Authority Certified"
      }),
      quantity: 100,
      unit: "tons",
      quality: "Premium Grade",
      location: "Plateau State, Nigeria",
      currentPrice: 2450000,
      imageUrl: "/copper-ore-tokenized-asset.png",
      status: AssetStatus.MINTED
    }
  },
  {
    // Business 2 - Ghana Agriculture
    business: {
      name: "Ghana Organic Farms Ltd",
      email: "info@ghanaorganic.com",
      phone: "+233-24-123-4567",
      address: "Ashanti Region",
      city: "Kumasi",
      state: "Ashanti",
      country: "Ghana",
      businessType: BusinessType.LIMITED_LIABILITY,
      industry: Industry.AGRICULTURE,
      isVerified: true,
      verificationLevel: VerificationLevel.PREMIUM,
      status: BusinessStatus.ACTIVE,
      walletAddress: "0x2345678901bcdef12345678901bcdef123456789"
    },
    collection: {
      name: "Organic Cocoa Collection",
      symbol: "COCO",
      description: "Fair trade certified organic cocoa beans",
      category: AssetCategory.AGRICULTURAL,
      assetType: "Cocoa Beans",
      maxSupply: 5000,
      status: CollectionStatus.ACTIVE
    },
    asset: {
      name: "Organic Cocoa Beans Token",
      description: "Fair trade certified organic cocoa beans, 50 tons premium quality",
      assetData: JSON.stringify({
        quality: "Organic",
        certification: "Fair Trade",
        weight: "50 tons",
        harvest: "2024 Season"
      }),
      quantity: 50,
      unit: "tons",
      quality: "Organic Premium",
      location: "Ashanti Region, Ghana",
      currentPrice: 1890000,
      imageUrl: "/cocoa-beans-tokenized.png",
      status: AssetStatus.LISTED
    }
  },
  {
    // Business 3 - South African Mining
    business: {
      name: "SA Gold Mining Rights Corp",
      email: "mining@sagold.co.za",
      phone: "+27-11-123-4567",
      address: "Johannesburg Mining District",
      city: "Johannesburg",
      state: "Gauteng",
      country: "South Africa",
      businessType: BusinessType.CORPORATION,
      industry: Industry.MINING,
      isVerified: true,
      verificationLevel: VerificationLevel.PREMIUM,
      status: BusinessStatus.ACTIVE,
      walletAddress: "0x3456789012cdef123456789012cdef1234567890"
    },
    collection: {
      name: "Gold Mining Rights Collection",
      symbol: "GOLD",
      description: "Exclusive gold mining rights and leases",
      category: AssetCategory.MINING,
      assetType: "Gold Mining Rights",
      maxSupply: 1000,
      status: CollectionStatus.ACTIVE
    },
    asset: {
      name: "Gold Mining Rights Token",
      description: "Exclusive mining rights for gold ore extraction, 5-year lease",
      assetData: JSON.stringify({
        leaseDuration: "5 years",
        location: "Johannesburg",
        estimatedYield: "500 oz/year",
        licenseNumber: "GM-2024-001"
      }),
      quantity: 1,
      unit: "lease",
      quality: "Exclusive Rights",
      location: "Johannesburg, South Africa",
      currentPrice: 5000000,
      imageUrl: "/gold-mining-rights-token.png",
      status: AssetStatus.LISTED
    }
  },
  {
    // Business 4 - Egyptian Agriculture
    business: {
      name: "Egyptian Cotton Exports",
      email: "sales@egyptcotton.com",
      phone: "+20-2-123-4567",
      address: "Nile Delta Region",
      city: "Alexandria",
      state: "Alexandria",
      country: "Egypt",
      businessType: BusinessType.LIMITED_LIABILITY,
      industry: Industry.AGRICULTURE,
      isVerified: false,
      verificationLevel: VerificationLevel.BASIC,
      status: BusinessStatus.ACTIVE,
      walletAddress: "0x4567890123def1234567890123def12345678901"
    },
    collection: {
      name: "Egyptian Cotton Collection",
      symbol: "COTT",
      description: "Premium Egyptian cotton for export",
      category: AssetCategory.AGRICULTURAL,
      assetType: "Cotton Bales",
      maxSupply: 20000,
      status: CollectionStatus.ACTIVE
    },
    asset: {
      name: "Cotton Bales Agricultural NFT",
      description: "Premium cotton bales from Egyptian farms, export quality",
      assetData: JSON.stringify({
        grade: "Export Quality",
        bales: "200",
        origin: "Egyptian Delta",
        stapleLength: "35mm"
      }),
      quantity: 200,
      unit: "bales",
      quality: "Export Grade",
      location: "Nile Delta, Egypt",
      currentPrice: 890000,
      imageUrl: "/cotton-bales-agricultural.png",
      status: AssetStatus.MINTED
    }
  }
]

async function main() {
  console.log('🌱 Starting marketplace data seeding...')

  try {
    for (const data of sampleMarketplaceData) {
      console.log(`📦 Creating business: ${data.business.name}`)
      
      // Create or find business
      const business = await prisma.business.upsert({
        where: { email: data.business.email },
        update: {},
        create: data.business
      })

      console.log(`📚 Creating collection: ${data.collection.name}`)
      
      // Create NFT collection
      const collection = await prisma.nFTCollection.create({
        data: {
          ...data.collection,
          businessId: business.id,
          createdBy: data.business.walletAddress
        }
      })

      console.log(`💎 Creating asset: ${data.asset.name}`)
      
      // Create NFT asset
      const asset = await prisma.nFTAsset.create({
        data: {
          ...data.asset,
          collectionId: collection.id,
          tokenId: `0.0.${Math.floor(Math.random() * 900000) + 100000}`, // Random token ID
          serialNumber: 1,
          createdBy: data.business.walletAddress!,
          ownerId: business.id,
          metadataUri: `ipfs://example-metadata-${collection.id}-${Math.random()}`
        }
      })

      console.log(`✅ Successfully created marketplace item: ${data.asset.name}`)
    }

    console.log('🎉 Marketplace data seeding completed successfully!')
    console.log('💡 You can now view the marketplace at /marketplace')

  } catch (error) {
    console.error('❌ Error seeding marketplace data:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })