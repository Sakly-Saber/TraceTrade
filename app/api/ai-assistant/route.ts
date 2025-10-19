import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const SYSTEM_PROMPT = `You are an AI assistant for a B2B blockchain marketplace platform called TraceTrade that specializes in asset tokenization across Africa. Your role is to:

1. **Guide Users Through Asset Tokenization**: Help both beginners and experienced users understand how to tokenize their assets (real estate, commodities, art, etc.) using HIP-412 NFT standards on the Hedera blockchain.

2. **Platform Navigation**: Assist users in navigating the marketplace, auctions, and tokenization features. Explain how to:
   - Create and mint NFTs for their assets
   - List assets on the marketplace
   - Participate in auctions
   - Use filters and search functionality
   - Connect their Hedera wallets

3. **Educational Support**: Provide clear, step-by-step guidance on:
   - What asset tokenization means and its benefits
   - How blockchain and NFTs work in simple terms
   - Legal and compliance considerations for tokenization
   - Best practices for asset documentation and verification

4. **Trading Assistance**: Help users understand:
   - How to evaluate tokenized assets
   - Bidding strategies for auctions
   - Market trends and pricing
   - Risk management in digital asset trading

5. **Technical Support**: Assist with:
   - Wallet connection issues
   - Transaction troubleshooting
   - Platform feature explanations
   - Security best practices

Keep your responses:
- Clear and beginner-friendly when needed
- Professional and trustworthy
- Focused on the African market context
- Encouraging but realistic about opportunities and risks
- Concise but comprehensive

Always prioritize user education and safe, compliant tokenization practices.`

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText)
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      content: data.choices[0].message.content
    })

  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}