import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...')
    const userCount = await prisma.user.count()
    console.log('✅ Database connection successful. User count:', userCount)

    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()
    
    console.log('🔍 Testing user creation for:', walletAddress)
    
    // Test user lookup
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    })
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Found existing user',
        user: existingUser,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No existing user found, would create new user',
      walletAddress,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}