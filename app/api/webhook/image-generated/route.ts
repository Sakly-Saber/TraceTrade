import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🎨 Received image generation webhook from n8n:', body)
    
    // Validate the webhook payload
    if (!body.success || !body.imageCID || !body.imageUrl) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', received: body },
        { status: 400 }
      )
    }

    // Log successful image generation
    console.log('✅ Image generated successfully:')
    console.log('   - Prompt:', body.prompt)
    console.log('   - CID:', body.imageCID)
    console.log('   - URL:', body.imageUrl)
    console.log('   - Timestamp:', body.timestamp)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      data: {
        imageCID: body.imageCID,
        imageUrl: body.imageUrl,
        prompt: body.prompt,
        timestamp: body.timestamp
      }
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Image generation webhook endpoint',
    endpoint: '/api/webhook/image-generated',
    methods: ['POST']
  })
}