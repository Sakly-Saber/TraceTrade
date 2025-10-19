"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"

export default function CreateAuctionPage() {
  const router = useRouter()
  const { address, isConnected, connect } = useWallet()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    commodityType: "",
    quantity: "",
    unit: "",
    quality: "",
    location: "",
    reservePrice: "",
    startTime: "",
    endTime: "",
    currency: "native", // native HBAR or ERC-20
  })

  const [files, setFiles] = useState<File[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1) // Multi-step form

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 5)) // Max 5 files
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.title && formData.description && formData.commodityType
      case 2:
        return formData.quantity && formData.unit && formData.quality && formData.location
      case 3:
        return formData.reservePrice && formData.startTime && formData.endTime
      default:
        return true
    }
  }

  const handleCreateAuction = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    setError("")
    setIsCreating(true)

    try {
      // Step 1: Upload files to IPFS
      const uploadedFiles = []
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/ipfs/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          uploadedFiles.push(result.cid)
        }
      }

      // Step 2: Create lot metadata
      const lotData = {
        name: formData.title,
        description: formData.description,
        commodityType: formData.commodityType,
        quantity: Number.parseInt(formData.quantity),
        unit: formData.unit,
        quality: formData.quality,
        location: formData.location,
        certifications: [],
        images: uploadedFiles,
        owner: address,
      }

      const lotResponse = await fetch("/api/lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lotData),
      })

      if (!lotResponse.ok) {
        throw new Error("Failed to create lot")
      }

      const lot = await lotResponse.json()

      // Step 3: Mint NFT (this would typically be done via smart contract)
      // For demo, we'll simulate this step

      // Step 4: Create auction
      const auctionData = {
        nftContract: process.env.NEXT_PUBLIC_LOT_NFT_ADDRESS,
        tokenId: Date.now(), // Simulated token ID
        reservePrice: formData.reservePrice,
        startTime: Math.floor(new Date(formData.startTime).getTime() / 1000),
        endTime: Math.floor(new Date(formData.endTime).getTime() / 1000),
        currency:
          formData.currency === "native"
            ? "0x0000000000000000000000000000000000000000"
            : process.env.NEXT_PUBLIC_TOKEN_ADDRESS,
        metadataURI: lot.lot.metadataURI,
      }

      // This would call the smart contract to create the auction
      console.log("Creating auction with data:", auctionData)

      // Simulate success
      setTimeout(() => {
        router.push("/auctions")
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create auction")
    } finally {
      setIsCreating(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="font-serif">Connect Wallet</CardTitle>
              <CardDescription>You need to connect your wallet to create an auction</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={connect} className="w-full">
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Create New Auction</h1>
            <p className="text-muted-foreground">List your commodity for transparent blockchain-secured bidding</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step >= stepNumber ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > stepNumber ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`w-16 h-0.5 mx-2 ${step > stepNumber ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Basic Info</span>
              <span>Details</span>
              <span>Auction Terms</span>
              <span>Review</span>
            </div>
          </div>

          <Card className="border-border">
            <CardContent className="p-6">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Basic Information</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Auction Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Premium Copper Ore Lot #001"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commodityType">Commodity Type *</Label>
                      <Select
                        value={formData.commodityType}
                        onValueChange={(value) => handleInputChange("commodityType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select commodity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minerals">Minerals & Ores</SelectItem>
                          <SelectItem value="agriculture">Agricultural Products</SelectItem>
                          <SelectItem value="equipment">Industrial Equipment</SelectItem>
                          <SelectItem value="textiles">Textiles & Materials</SelectItem>
                          <SelectItem value="energy">Energy Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed description of your commodity including quality, specifications, and any relevant certifications..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Images & Documents</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload images and supporting documents</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose Files
                        </label>
                      </Button>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Commodity Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Commodity Details</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="e.g., 100"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit *</Label>
                      <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="bales">Bales</SelectItem>
                          <SelectItem value="barrels">Barrels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="quality">Quality Grade *</Label>
                      <Input
                        id="quality"
                        placeholder="e.g., Grade A, 25% purity"
                        value={formData.quality}
                        onChange={(e) => handleInputChange("quality", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Lagos, Nigeria"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Auction Terms */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Auction Terms</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="reservePrice">Reserve Price ($) *</Label>
                      <Input
                        id="reservePrice"
                        type="number"
                        placeholder="e.g., 2000000"
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange("reservePrice", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Bidding Currency *</Label>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="native">HBAR (Native)</SelectItem>
                          <SelectItem value="token">AGT (Demo Token)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Auction Start *</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Auction End *</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        min={formData.startTime || new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-serif font-semibold mb-4">Review & Create</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="font-serif text-base">Commodity Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <strong>Title:</strong> {formData.title}
                        </div>
                        <div>
                          <strong>Type:</strong> {formData.commodityType}
                        </div>
                        <div>
                          <strong>Quantity:</strong> {formData.quantity} {formData.unit}
                        </div>
                        <div>
                          <strong>Quality:</strong> {formData.quality}
                        </div>
                        <div>
                          <strong>Location:</strong> {formData.location}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="font-serif text-base">Auction Terms</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <strong>Reserve Price:</strong> $
                          {Number.parseInt(formData.reservePrice || "0").toLocaleString()}
                        </div>
                        <div>
                          <strong>Currency:</strong> {formData.currency === "native" ? "HBAR" : "AGT"}
                        </div>
                        <div>
                          <strong>Start:</strong> {new Date(formData.startTime).toLocaleString()}
                        </div>
                        <div>
                          <strong>End:</strong> {new Date(formData.endTime).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
                  Previous
                </Button>

                {step < 4 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!validateStep(step)}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleCreateAuction} disabled={isCreating}>
                    {isCreating ? "Creating Auction..." : "Create Auction"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
