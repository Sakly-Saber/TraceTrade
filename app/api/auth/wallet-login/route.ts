import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, walletType } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Find business by wallet address
    const business = await prisma.business.findFirst({
      where: {
        walletAddress: walletAddress
      },
      include: {
        users: {
          where: {
            isActive: true
          },
          take: 1
        }
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'No account found with this wallet address. Please register first.' },
        { status: 404 }
      )
    }

    if (business.users.length === 0) {
      return NextResponse.json(
        { error: 'No active user found for this business' },
        { status: 404 }
      )
    }

    const user = business.users[0]

    // Update last login time
    await prisma.businessUser.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        businessId: business.id,
        walletAddress: walletAddress,
        loginMethod: 'wallet'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Return success response with token and user data
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        businessId: business.id,
        business: {
          id: business.id,
          name: business.name,
          email: business.email,
          isVerified: business.isVerified,
          status: business.status,
          walletAddress: business.walletAddress,
          walletType: business.walletType
        }
      }
    })

  } catch (error) {
    console.error('Wallet login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}