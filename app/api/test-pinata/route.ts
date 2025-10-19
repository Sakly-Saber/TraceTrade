import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.IPFS_TOKEN;
    const PINATA_GATEWAY = process.env.IPFS_GATEWAY || "amaranth-bitter-falcon-175.mypinata.cloud";

    console.log('🔍 Testing Pinata configuration...')
    console.log('Gateway:', PINATA_GATEWAY)
    console.log('JWT exists:', !!PINATA_JWT)
    console.log('JWT length:', PINATA_JWT?.length || 0)

    if (!PINATA_JWT) {
      return NextResponse.json({
        success: false,
        error: 'No Pinata JWT token found',
        gateway: PINATA_GATEWAY,
        envVars: {
          NEXT_PUBLIC_PINATA_JWT: !!process.env.NEXT_PUBLIC_PINATA_JWT,
          IPFS_TOKEN: !!process.env.IPFS_TOKEN,
          IPFS_GATEWAY: !!process.env.IPFS_GATEWAY
        }
      }, { status: 500 })
    }

    // Test Pinata authentication
    const authResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      return NextResponse.json({
        success: false,
        error: `Pinata auth failed: ${authResponse.status} ${errorText}`,
        gateway: PINATA_GATEWAY,
        jwtLength: PINATA_JWT.length
      }, { status: 500 })
    }

    const authResult = await authResponse.json()

    // Test gateway connectivity by checking a known IPFS hash
    const testHash = 'QmNRCQWfgze6AbBCaT1rkrkV5tJ2aP4oTNPb5JZcXYywve' // A common test hash
    const gatewayUrl = `https://${PINATA_GATEWAY}/ipfs/${testHash}`
    
    let gatewayTest = 'unknown'
    try {
      const gatewayResponse = await fetch(gatewayUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      gatewayTest = gatewayResponse.ok ? 'accessible' : `failed (${gatewayResponse.status})`
    } catch (error) {
      gatewayTest = `error: ${error instanceof Error ? error.message : 'unknown'}`
    }

    return NextResponse.json({
      success: true,
      message: 'Pinata authentication successful',
      authResult: authResult,
      gateway: PINATA_GATEWAY,
      gatewayTest: gatewayTest,
      gatewayUrl: gatewayUrl,
      configuration: {
        jwtLength: PINATA_JWT.length,
        jwtPrefix: PINATA_JWT.substring(0, 10) + '...',
        envVars: {
          NEXT_PUBLIC_PINATA_JWT: !!process.env.NEXT_PUBLIC_PINATA_JWT,
          IPFS_TOKEN: !!process.env.IPFS_TOKEN,
          IPFS_GATEWAY: !!process.env.IPFS_GATEWAY
        }
      }
    })

  } catch (error) {
    console.error('❌ Pinata test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      gateway: process.env.IPFS_GATEWAY || "amaranth-bitter-falcon-175.mypinata.cloud"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.IPFS_TOKEN;
    const PINATA_GATEWAY = process.env.IPFS_GATEWAY || "amaranth-bitter-falcon-175.mypinata.cloud";

    if (!PINATA_JWT) {
      return NextResponse.json({
        success: false,
        error: 'No Pinata JWT token found'
      }, { status: 500 })
    }

    // Create a simple test file to upload
    const testContent = {
      name: "Test NFT",
      description: "This is a test NFT to verify Pinata pinning",
      image: "test-image-url",
      created_at: new Date().toISOString(),
      test: true
    }

    const blob = new Blob([JSON.stringify(testContent, null, 2)], { 
      type: 'application/json' 
    })
    
    const file = new File([blob], 'test-metadata.json', { 
      type: 'application/json' 
    })

    const formData = new FormData()
    formData.append('file', file)

    // Add pinata metadata with proper pinning options
    const pinataMetadata = JSON.stringify({
      name: `Test-Upload-${Date.now()}`,
      keyvalues: {
        type: 'test-upload',
        uploadedAt: new Date().toISOString(),
        purpose: 'pinata-connectivity-test'
      }
    })
    
    const pinataOptions = JSON.stringify({
      cidVersion: 1
    })

    formData.append('pinataMetadata', pinataMetadata)
    formData.append('pinataOptions', pinataOptions)

    console.log('🧪 Testing file upload to Pinata...')
    
    const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      return NextResponse.json({
        success: false,
        error: `Upload failed: ${uploadResponse.status} ${errorText}`,
        gateway: PINATA_GATEWAY
      }, { status: 500 })
    }

    const uploadResult = await uploadResponse.json()
    const ipfsHash = uploadResult.IpfsHash
    const gatewayUrl = `https://${PINATA_GATEWAY}/ipfs/${ipfsHash}`

    // Test immediate accessibility
    let accessibilityTest = 'pending'
    try {
      // Wait a moment for propagation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const accessResponse = await fetch(gatewayUrl, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      accessibilityTest = accessResponse.ok ? 'accessible' : `failed (${accessResponse.status})`
    } catch (error) {
      accessibilityTest = `error: ${error instanceof Error ? error.message : 'unknown'}`
    }

    return NextResponse.json({
      success: true,
      message: 'Test upload successful',
      uploadResult: uploadResult,
      gatewayUrl: gatewayUrl,
      accessibilityTest: accessibilityTest,
      gateway: PINATA_GATEWAY,
      instructions: `Visit ${gatewayUrl} to test if the file is accessible via your gateway`
    })

  } catch (error) {
    console.error('❌ Test upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}