'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react'

interface DocumentFile {
  id: string
  file: File
  type: string
  description: string
  preview?: string
  status: 'uploading' | 'uploaded' | 'error'
  error?: string
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: DocumentFile[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  required?: boolean
}

const DOCUMENT_TYPES = [
  { value: 'BUSINESS_REGISTRATION', label: 'Business Registration Certificate' },
  { value: 'TAX_CERTIFICATE', label: 'Tax Certificate' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'IDENTITY_DOCUMENT', label: 'Identity Document' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'CERTIFICATION', label: 'Professional Certification' },
  { value: 'INSURANCE', label: 'Insurance Document' },
  { value: 'OTHER', label: 'Other Document' },
]

export function DocumentUpload({
  onDocumentsChange,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  required = false
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload PDF, JPEG, or PNG files.`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxFileSize) {
      return `File size ${fileSizeMB.toFixed(1)}MB exceeds the maximum limit of ${maxFileSize}MB.`
    }

    return null
  }

  const handleFiles = (files: FileList) => {
    setError('')
    
    if (documents.length + files.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files.`)
      return
    }

    const newDocuments: DocumentFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validationError = validateFile(file)

      if (validationError) {
        setError(validationError)
        continue
      }

      const docId = `doc-${Date.now()}-${i}`
      const newDoc: DocumentFile = {
        id: docId,
        file,
        type: '',
        description: '',
        status: 'uploading',
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setDocuments(prev => prev.map(doc => 
            doc.id === docId ? { ...doc, preview: e.target?.result as string } : doc
          ))
        }
        reader.readAsDataURL(file)
      }

      newDocuments.push(newDoc)
    }

    const updatedDocuments = [...documents, ...newDocuments]
    setDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const updateDocument = (id: string, updates: Partial<DocumentFile>) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === id ? { ...doc, ...updates } : doc
    )
    setDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
  }

  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id)
    setDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">
          Business Documents {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Upload business registration, certificates, and other supporting documents (PDF, JPEG, PNG, max {maxFileSize}MB each)
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="p-6">
          <div
            className="text-center"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: PDF, JPEG, PNG (max {maxFileSize}MB each)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Uploaded Documents ({documents.length}/{maxFiles})</h4>
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start space-x-4">
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {doc.preview ? (
                    <img
                      src={doc.preview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                      <File className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Document Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{doc.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file.size)} • {doc.file.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.status === 'uploaded' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`type-${doc.id}`} className="text-xs">
                        Document Type *
                      </Label>
                      <Select
                        value={doc.type}
                        onValueChange={(value) => updateDocument(doc.id, { type: value, status: 'uploaded' })}
                      >
                        <SelectTrigger id={`type-${doc.id}`} className="h-8 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`desc-${doc.id}`} className="text-xs">
                        Description (Optional)
                      </Label>
                      <Input
                        id={`desc-${doc.id}`}
                        placeholder="Brief description"
                        value={doc.description}
                        onChange={(e) => updateDocument(doc.id, { description: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}