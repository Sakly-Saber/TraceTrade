import { create, type IPFSHTTPClient } from "ipfs-http-client"
import axios from "axios"

interface IPFSConfig {
  endpoint: string
  token?: string
  gateway: string
}

class IPFSService {
  private client: IPFSHTTPClient | null = null
  private config: IPFSConfig

  constructor() {
    this.config = {
      endpoint: process.env.IPFS_ENDPOINT || "https://api.web3.storage",
      token: process.env.IPFS_TOKEN || "",
      gateway: process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs",
    }

    if (this.config.token) {
      this.initializeClient()
    }
  }

  private initializeClient() {
    try {
      this.client = create({
        url: this.config.endpoint,
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      })
    } catch (error) {
      console.error("Failed to initialize IPFS client:", error)
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    if (!this.client) {
      throw new Error("IPFS client not initialized")
    }

    try {
      const result = await this.client.add(
        {
          path: filename,
          content: file,
        },
        {
          pin: true,
          wrapWithDirectory: false,
        },
      )

      return result.cid.toString()
    } catch (error) {
      console.error("IPFS upload error:", error)
      throw new Error("Failed to upload file to IPFS")
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: any): Promise<string> {
    if (!this.client) {
      throw new Error("IPFS client not initialized")
    }

    try {
      const jsonString = JSON.stringify(metadata, null, 2)
      const result = await this.client.add(jsonString, {
        pin: true,
      })

      return result.cid.toString()
    } catch (error) {
      console.error("IPFS metadata upload error:", error)
      throw new Error("Failed to upload metadata to IPFS")
    }
  }

  /**
   * Create NFT metadata following HIP-412 standard
   */
  async createNFTMetadata(lotData: {
    name: string
    description: string
    commodityType: string
    quantity: number
    unit: string
    quality: string
    location: string
    certifications: string[]
    images: string[]
    documents?: string[]
  }): Promise<string> {
    const metadata = {
      name: lotData.name,
      description: lotData.description,
      image: lotData.images[0] ? `ipfs://${lotData.images[0]}` : "",
      type: "object",
      format: "HIP412@2.0.0",
      properties: {
        commodityType: lotData.commodityType,
        quantity: {
          value: lotData.quantity,
          unit: lotData.unit,
        },
        quality: lotData.quality,
        location: lotData.location,
        certifications: lotData.certifications,
        createdAt: new Date().toISOString(),
        version: "1.0.0",
      },
      files: [
        ...lotData.images.map((cid, index) => ({
          uri: `ipfs://${cid}`,
          type: "image",
          metadata: {
            name: `Image ${index + 1}`,
            description: `Product image ${index + 1}`,
          },
        })),
        ...(lotData.documents || []).map((cid, index) => ({
          uri: `ipfs://${cid}`,
          type: "document",
          metadata: {
            name: `Document ${index + 1}`,
            description: `Supporting document ${index + 1}`,
          },
        })),
      ],
      localization: {
        uri: "",
        default: "en",
        locales: ["en"],
      },
    }

    return this.uploadMetadata(metadata)
  }

  /**
   * Get IPFS URL for a CID
   */
  getIPFSUrl(cid: string): string {
    return `${this.config.gateway}/${cid}`
  }

  /**
   * Pin existing content
   */
  async pinContent(cid: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("IPFS client not initialized")
    }

    try {
      await this.client.pin.add(cid)
      return true
    } catch (error) {
      console.error("IPFS pin error:", error)
      return false
    }
  }

  /**
   * Alternative upload using Web3.Storage API
   */
  async uploadToWeb3Storage(file: Buffer, filename: string): Promise<string> {
    if (!this.config.token) {
      throw new Error("Web3.Storage token not configured")
    }

    try {
      const formData = new FormData()
      const blob = new Blob([file])
      formData.append("file", blob, filename)

      const response = await axios.post("https://api.web3.storage/upload", formData, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      return response.data.cid
    } catch (error) {
      console.error("Web3.Storage upload error:", error)
      throw new Error("Failed to upload to Web3.Storage")
    }
  }
}

export const ipfsService = new IPFSService()
