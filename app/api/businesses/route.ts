import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      // Business Information
      businessName,
      businessEmail,
      businessPhone,
      website,
      description,
      address,
      city,
      state,
      country = 'Nigeria',
      postalCode,
      registrationNumber,
      taxId,
      businessType,
      industry,
      foundedYear,
      employeeCount,
      annualRevenue,
      
      // Primary User Information
      firstName,
      lastName,
      userEmail,
      password,
      phone,
      
      // Wallet Information
      walletAddress,
      walletType
    } = body

    // Validate required fields
    if (!businessName || !businessEmail || !firstName || !lastName || !userEmail || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if business email already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { email: businessEmail }
    })

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'Business with this email already exists' },
        { status: 409 }
      )
    }

    // Check if user email already exists
    const existingUser = await prisma.businessUser.findUnique({
      where: { email: userEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Convert wallet type to proper enum value
    let dbWalletType: 'HASHCONNECT' | 'METAMASK' | null = null
    if (walletType) {
      if (walletType.toUpperCase() === 'HASHCONNECT' || walletType === 'hashconnect') {
        dbWalletType = 'HASHCONNECT'
      } else if (walletType.toUpperCase() === 'METAMASK' || walletType === 'metamask') {
        dbWalletType = 'METAMASK'
      }
    }

    // Create business and owner user in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create business
      const business = await tx.business.create({
        data: {
          name: businessName,
          email: businessEmail,
          phone: businessPhone,
          website: website || null,
          description: description || null,
          address,
          city,
          state,
          country,
          postalCode: postalCode || null,
          registrationNumber: registrationNumber || null,
          taxId: taxId || null,
          businessType: businessType,
          industry: industry,
          foundedYear: foundedYear ? parseInt(foundedYear) : null,
          employeeCount: employeeCount && employeeCount !== '' ? employeeCount : null,
          annualRevenue: annualRevenue && annualRevenue !== '' ? annualRevenue : null,
          walletAddress: walletAddress || null,
          walletType: dbWalletType,
        }
      })

      // Create owner user
      const user = await tx.businessUser.create({
        data: {
          firstName,
          lastName,
          email: userEmail,
          phone,
          passwordHash: hashedPassword,
          role: 'OWNER',
          businessId: business.id,
        }
      })

      return { business, user }
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.user.id, 
        businessId: result.business.id,
        role: result.user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Remove sensitive data from response
    const { passwordHash: _, ...userWithoutPassword } = result.user

    return NextResponse.json({
      message: 'Business registered successfully',
      business: result.business,
      user: userWithoutPassword,
      token
    }, { status: 201 })

  } catch (error) {
    console.error('Business registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const industry = searchParams.get('industry')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    const where: any = {}
    
    if (industry) where.industry = industry
    if (status) where.status = status
    if (verified !== null) where.isVerified = verified === 'true'

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            }
          },
          _count: {
            select: {
              auctions: true,
              reviews: true,
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.business.count({ where })
    ])

    return NextResponse.json({
      businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get businesses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}