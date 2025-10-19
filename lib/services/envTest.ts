// Environment Configuration Test
// This file tests that your environment variables are correctly configured

export const testEnvironmentConfiguration = () => {
  console.log('🔧 Testing Environment Configuration...\n')
  
  // Check IPFS Token
  const ipfsToken = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.IPFS_TOKEN
  console.log('🔑 IPFS Token:', ipfsToken ? '✅ Configured' : '❌ Missing')
  
  // Check Gateway
  const gateway = process.env.IPFS_GATEWAY
  console.log('🌐 IPFS Gateway:', gateway || '❌ Missing')
  
  // Check API Key
  const apiKey = process.env.PINATA_API_KEY
  console.log('🔐 Pinata API Key:', apiKey ? '✅ Configured' : '❌ Missing')
  
  // Check API Secret
  const apiSecret = process.env.PINATA_API_SECRET
  console.log('🔒 Pinata API Secret:', apiSecret ? '✅ Configured' : '❌ Missing')
  
  console.log('\n📝 Expected Configuration:')
  console.log(`- Gateway: amaranth-bitter-falcon-175.mypinata.cloud`)
  console.log(`- Token should start with: eyJhbGciOiJIUzI1NiI...`)
  
  return {
    hasToken: !!ipfsToken,
    hasGateway: !!gateway,
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    gateway,
    isConfigured: !!(ipfsToken && gateway)
  }
}

// Test URL generation
export const testUrlGeneration = (sampleCid: string = 'QmTestCid123') => {
  const gateway = process.env.IPFS_GATEWAY || 'amaranth-bitter-falcon-175.mypinata.cloud'
  const expectedUrl = `https://${gateway}/ipfs/${sampleCid}`
  
  console.log('\n🔗 URL Generation Test:')
  console.log(`Sample CID: ${sampleCid}`)
  console.log(`Generated URL: ${expectedUrl}`)
  
  return expectedUrl
}

// Run tests when imported
if (typeof window === 'undefined') {
  console.log('🧪 Environment Test Results:')
  testEnvironmentConfiguration()
  testUrlGeneration()
}