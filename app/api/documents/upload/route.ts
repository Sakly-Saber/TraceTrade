import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Helper function to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  
  const user = await prisma.businessUser.findUnique({
    where: { id: decoded.userId },
    include: { business: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

// Helper function to validate file
function validateFile(file: File) {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`)
  }

  if (file.size > maxSize) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit`)
  }
}

// Helper function to get file extension from MIME type
function getFileExtension(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png'
  }
  return mimeMap[mimeType] || '.bin'
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    const formData = await request.formData()

    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const description = formData.get('description') as string
    const businessId = formData.get('businessId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    // Validate user has access to this business
    if (user.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Unauthorized access to business' },
        { status: 403 }
      )
    }

    // Validate file
    validateFile(file)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const fileExtension = getFileExtension(file.type)
    const fileName = `${randomUUID()}${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    const fileUrl = `/uploads/documents/${fileName}`

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get client IP and user agent for audit
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Save document record to database
    const document = await prisma.businessDocument.create({
      data: {
        name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        type: type,
        description: description || null,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        originalName: file.name,
        category: type.toLowerCase(),
        isValidFormat: true,
        virusScanStatus: 'PENDING',
        businessId: businessId,
        uploadedBy: user.id,
        ipAddress: clientIP,
        userAgent: userAgent,
      }
    })

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Document upload error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('File type') || error.message.includes('File size')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId') || user.businessId

    // Validate user has access to this business
    if (user.businessId !== businessId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access to business' },
        { status: 403 }
      )
    }

    const documents = await prisma.businessDocument.findMany({
      where: { businessId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        originalName: true,
        isVerified: true,
        verifiedAt: true,
        virusScanStatus: true,
        uploadedAt: true,
      }
    })

    return NextResponse.json({
      documents
    })

  } catch (error) {
    console.error('Get documents error:', error)
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}