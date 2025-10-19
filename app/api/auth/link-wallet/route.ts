import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, walletType, email, password } = await request.json()

    if (!walletAddress || !walletType || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // First verify the user's credentials
    const user = await prisma.businessUser.findUnique({
      where: { email },
      include: {
        business: true
      }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if wallet is already associated with another business
    const existingWalletBusiness = await prisma.business.findFirst({
      where: { 
        walletAddress,
        id: { not: user.businessId } // Exclude current user's business
      }
    })

    if (existingWalletBusiness) {
      return NextResponse.json(
        { error: 'This wallet address is already associated with another account' },
        { status: 409 }
      )
    }

    // Update the business with wallet information
    const updatedBusiness = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        walletAddress,
        walletType
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        walletType: true
      }
    })

    return NextResponse.json({
      message: 'Wallet linked successfully',
      business: updatedBusiness
    })

  } catch (error) {
    console.error('Error linking wallet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}