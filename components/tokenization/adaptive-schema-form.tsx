'use client'

import React, { useState, useEffect } from 'react'
import { Upload, FileText, Image, AlertCircle, Check, X, Plus } from 'lucide-react'
import { AssetSchema, SchemaField, getSchemaForAsset } from '@/lib/data/industry-filters'
import { uploadImageToPinata, uploadMultipleImagesToPinata, validateFileForUpload } from '@/lib/services/pinataImageService'

interface AdaptiveSchemaFormProps {
  industryId: string
  subIndustryId: string
  specificAsset: string
  onDataChange: (data: any) => void
  onImagesChange: (images: string[]) => void
  onDocumentsChange: (documents: string[]) => void
  className?: string
}

interface FormData {
  [key: string]: any
}

interface FileUploadState {
  images: File[]
  documents: File[]
  uploadingImages: boolean
  uploadingDocuments: boolean
  uploadProgress: { [key: string]: number }
  additionalImageFields: Array<{ id: string; label: string }>
  additionalDocumentFields: Array<{ id: string; label: string }>
}

export const AdaptiveSchemaForm: React.FC<AdaptiveSchemaFormProps> = ({
  industryId,
  subIndustryId,
  specificAsset,
  onDataChange,
  onImagesChange,
  onDocumentsChange,
  className = ''
}) => {
  const [schema, setSchema] = useState<AssetSchema | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [fileState, setFileState] = useState<FileUploadState>({
    images: [],
    documents: [],
    uploadingImages: false,
    uploadingDocuments: false,
    uploadProgress: {},
    additionalImageFields: [],
    additionalDocumentFields: []
  })

  // Load schema when selection changes
  useEffect(() => {
    if (industryId && subIndustryId) {
      const newSchema = getSchemaForAsset(industryId, subIndustryId)
      setSchema(newSchema)
      setFormData({})
      setErrors({})
      setFileState({
        images: [],
        documents: [],
        uploadingImages: false,
        uploadingDocuments: false,
        uploadProgress: {},
        additionalImageFields: [],
        additionalDocumentFields: []
      })
    }
  }, [industryId, subIndustryId])

  // Validate field
  const validateField = (field: SchemaField, value: any): string | null => {
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.name} is required`
    }

    if (field.validation && value) {
      const { min, max, pattern, message } = field.validation

      if (field.type === 'number') {
        const numValue = parseFloat(value)
        if (min !== undefined && numValue < min) {
          return message || `${field.name} must be at least ${min}`
        }
        if (max !== undefined && numValue > max) {
          return message || `${field.name} must be at most ${max}`
        }
      }

      if (pattern && !new RegExp(pattern).test(value.toString())) {
        return message || `${field.name} format is invalid`
      }
    }

    return null
  }

  // Handle form field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    const newFormData = { ...formData, [fieldId]: value }
    setFormData(newFormData)

    // Validate field
    const field = schema?.fields.find(f => f.id === fieldId)
    if (field) {
      const error = validateField(field, value)
      setErrors(prev => ({
        ...prev,
        [fieldId]: error || ''
      }))
    }

    // Notify parent
    onDataChange(newFormData)
  }

  // Handle file uploads
  const handleImageUpload = async (files: FileList) => {
    const validFiles: File[] = []
    const uploadErrors: string[] = []

    // Validate files
    Array.from(files).forEach(file => {
      const validation = validateFileForUpload(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        uploadErrors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (uploadErrors.length > 0) {
      alert(`Upload errors:\n${uploadErrors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    setFileState(prev => ({ ...prev, uploadingImages: true }))

    try {
      const uploadResults = await uploadMultipleImagesToPinata(validFiles)
      
      setFileState(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles],
        uploadingImages: false
      }))

      onImagesChange(uploadResults)
    } catch (error) {
      console.error('Image upload failed:', error)
      setFileState(prev => ({ ...prev, uploadingImages: false }))
      alert('Image upload failed. Please try again.')
    }
  }

  const handleDocumentUpload = async (files: FileList) => {
    const validFiles: File[] = []
    const uploadErrors: string[] = []

    // Validate files (PDFs and documents)
    Array.from(files).forEach(file => {
      const validation = validateFileForUpload(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        uploadErrors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (uploadErrors.length > 0) {
      alert(`Upload errors:\n${uploadErrors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    setFileState(prev => ({ ...prev, uploadingDocuments: true }))

    try {
      const uploadPromises = validFiles.map(file => uploadImageToPinata(file))
      const uploadResults = await Promise.all(uploadPromises)
      
      setFileState(prev => ({
        ...prev,
        documents: [...prev.documents, ...validFiles],
        uploadingDocuments: false
      }))

      onDocumentsChange(uploadResults)
    } catch (error) {
      console.error('Document upload failed:', error)
      setFileState(prev => ({ ...prev, uploadingDocuments: false }))
      alert('Document upload failed. Please try again.')
    }
  }

  // Add more image field
  const addImageField = () => {
    const imageLabels = [
      'Secondary Asset Image',
      'Detail View Image', 
      'Additional Angle Image',
      'Supporting Image',
      'Extra Asset Image'
    ]
    
    const labelIndex = fileState.additionalImageFields.length
    const label = labelIndex < imageLabels.length 
      ? imageLabels[labelIndex] 
      : `Asset Image ${labelIndex + 2}`
      
    const newField = {
      id: `additional-image-${Date.now()}`,
      label: label
    }
    setFileState(prev => ({
      ...prev,
      additionalImageFields: [...prev.additionalImageFields, newField]
    }))
  }

  // Add more document field
  const addDocumentField = () => {
    const documentLabels = [
      'Legal Documentation',
      'Compliance Certificate', 
      'Technical Specification',
      'Insurance Document',
      'Financial Statement',
      'Supporting Evidence',
      'Additional Document'
    ]
    
    const labelIndex = fileState.additionalDocumentFields.length
    const label = labelIndex < documentLabels.length 
      ? documentLabels[labelIndex] 
      : `Document ${labelIndex + 2}`
      
    const newField = {
      id: `additional-document-${Date.now()}`,
      label: label
    }
    setFileState(prev => ({
      ...prev,
      additionalDocumentFields: [...prev.additionalDocumentFields, newField]
    }))
  }

  // Remove additional image field
  const removeImageField = (fieldId: string) => {
    setFileState(prev => ({
      ...prev,
      additionalImageFields: prev.additionalImageFields.filter(field => field.id !== fieldId)
    }))
  }

  // Remove additional document field
  const removeDocumentField = (fieldId: string) => {
    setFileState(prev => ({
      ...prev,
      additionalDocumentFields: prev.additionalDocumentFields.filter(field => field.id !== fieldId)
    }))
  }

  // Render form field based on type
  const renderField = (field: SchemaField) => {
    const hasError = errors[field.id]

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              {field.name}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 border rounded-xl transition-all duration-200
                         focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm
                         ${hasError 
                           ? 'border-red-300 focus:ring-red-500/20' 
                           : 'border-gray-200 focus:ring-blue-500/20 hover:border-blue-300'
                         }`}
            />
            {hasError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {hasError}
              </div>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              {field.name}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl transition-all duration-200
                         focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm resize-none
                         ${hasError 
                           ? 'border-red-300 focus:ring-red-500/20' 
                           : 'border-gray-200 focus:ring-blue-500/20 hover:border-blue-300'
                         }`}
            />
            {hasError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {hasError}
              </div>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              {field.name}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl transition-all duration-200
                         focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm
                         ${hasError 
                           ? 'border-red-300 focus:ring-red-500/20' 
                           : 'border-gray-200 focus:ring-blue-500/20 hover:border-blue-300'
                         }`}
            >
              <option value="">Select {field.name}...</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {hasError}
              </div>
            )}
          </div>
        )

      case 'multiselect':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              {field.name}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={(formData[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = formData[field.id] || []
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option)
                      handleFieldChange(field.id, newValues)
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500/20"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {hasError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {hasError}
              </div>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              {field.name}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl transition-all duration-200
                         focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm
                         ${hasError 
                           ? 'border-red-300 focus:ring-red-500/20' 
                           : 'border-gray-200 focus:ring-blue-500/20 hover:border-blue-300'
                         }`}
            />
            {hasError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {hasError}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (!schema) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please select an asset category to see the form</p>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Schema Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-800">{schema.name} Details</h3>
        <p className="text-gray-600">Provide specific information about your {specificAsset.toLowerCase()}</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schema.fields.map(renderField)}
      </div>

      {/* File Uploads */}
      <div className="space-y-6">
        {/* Dynamic Image Upload */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Asset Images
            <span className="text-sm font-normal text-gray-500 ml-2">(Upload images of your asset)</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Image Upload */}
            <div className="p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 transition-all duration-200 bg-blue-50/30">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-semibold text-blue-900 mb-2 text-lg">Primary Asset Image</p>
                <p className="text-sm text-blue-600 mb-4">JPG, PNG, GIF up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="primary-image"
                />
                <label
                  htmlFor="primary-image"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  Upload Images
                </label>
              </div>
            </div>
            
            {/* Additional Image Fields */}
            {fileState.additionalImageFields.map((field, index) => (
              <div key={field.id} className="p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 transition-all duration-200 bg-blue-50/30 relative">
                <button
                  onClick={() => removeImageField(field.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="font-semibold text-blue-900 mb-2 text-lg">{field.label}</p>
                  <p className="text-sm text-blue-600 mb-4">JPG, PNG, GIF up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id={field.id}
                  />
                  <label
                    htmlFor={field.id}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-green-700 cursor-pointer transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Images
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add More Images Button */}
          <div className="flex justify-center">
            <button
              onClick={addImageField}
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-dashed border-purple-400 text-purple-600 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              ADD MORE IMAGES
            </button>
          </div>
          
          {fileState.uploadingImages && (
            <div className="text-center text-blue-600 bg-blue-50 rounded-lg p-4">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="font-medium">Uploading images to IPFS...</p>
            </div>
          )}
          
          {fileState.images.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">Uploaded Images:</h5>
              <div className="flex flex-wrap gap-2">
                {fileState.images.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    <Check className="w-4 h-4" />
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Document Upload */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Asset Documents
            <span className="text-sm font-normal text-gray-500 ml-2">(Upload supporting documents for your asset)</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Document Upload */}
            <div className="p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 transition-all duration-200 bg-green-50/30">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-900 mb-2 text-lg">Primary Document</p>
                <p className="text-sm text-green-600 mb-4">PDF, DOC, DOCX up to 50MB</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                  className="hidden"
                  id="primary-document"
                />
                <label
                  htmlFor="primary-document"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 cursor-pointer transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  Upload Document
                </label>
              </div>
            </div>
            
            {/* Additional Document Fields */}
            {fileState.additionalDocumentFields.map((field) => (
              <div key={field.id} className="p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 transition-all duration-200 bg-orange-50/30 relative">
                <button
                  onClick={() => removeDocumentField(field.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-green-900 mb-2 text-lg">{field.label}</p>
                  <p className="text-sm text-green-600 mb-4">PDF, DOC, DOCX up to 50MB</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                    className="hidden"
                    id={field.id}
                  />
                  <label
                    htmlFor={field.id}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 cursor-pointer transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add More Documents Button */}
          <div className="flex justify-center">
            <button
              onClick={addDocumentField}
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-dashed border-teal-400 text-teal-600 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              ADD MORE DOCUMENTS
            </button>
          </div>
          
          {fileState.uploadingDocuments && (
            <div className="text-center text-green-600 bg-green-50 rounded-lg p-4">
              <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="font-medium">Uploading documents to IPFS...</p>
            </div>
          )}
          
          {fileState.documents.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-800 mb-2">Uploaded Documents:</h5>
              <div className="flex flex-wrap gap-2">
                {fileState.documents.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    <Check className="w-4 h-4" />
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}