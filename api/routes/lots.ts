import { Router } from "express"
import multer from "multer"
import { ipfsService } from "../services/ipfs"
import { validateLotData } from "../middleware/validation"
import type { Express } from "express"

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// In-memory storage for demo (replace with database in production)
interface LotData {
  id: string
  name: string
  description: string
  commodityType: string
  quantity: number
  unit: string
  quality: string
  location: string
  certifications: string[]
  images: string[]
  documents: string[]
  metadataURI: string
  createdAt: string
  owner: string
  status: "draft" | "listed" | "auctioned" | "sold"
}

const lots: Map<string, LotData> = new Map()

/**
 * GET /api/lots - Get all lots
 */
router.get("/", (req, res) => {
  try {
    const { status, commodityType, location, limit = "20", offset = "0" } = req.query

    let filteredLots = Array.from(lots.values())

    // Apply filters
    if (status) {
      filteredLots = filteredLots.filter((lot) => lot.status === status)
    }

    if (commodityType) {
      filteredLots = filteredLots.filter((lot) =>
        lot.commodityType.toLowerCase().includes((commodityType as string).toLowerCase()),
      )
    }

    if (location) {
      filteredLots = filteredLots.filter((lot) =>
        lot.location.toLowerCase().includes((location as string).toLowerCase()),
      )
    }

    // Pagination
    const limitNum = Number.parseInt(limit as string)
    const offsetNum = Number.parseInt(offset as string)
    const paginatedLots = filteredLots.slice(offsetNum, offsetNum + limitNum)

    res.json({
      lots: paginatedLots,
      total: filteredLots.length,
      limit: limitNum,
      offset: offsetNum,
    })
  } catch (error) {
    console.error("Error fetching lots:", error)
    res.status(500).json({ error: "Failed to fetch lots" })
  }
})

/**
 * GET /api/lots/:id - Get specific lot
 */
router.get("/:id", (req, res) => {
  try {
    const lot = lots.get(req.params.id)

    if (!lot) {
      return res.status(404).json({ error: "Lot not found" })
    }

    res.json(lot)
  } catch (error) {
    console.error("Error fetching lot:", error)
    res.status(500).json({ error: "Failed to fetch lot" })
  }
})

/**
 * POST /api/lots - Create new lot with file uploads
 */
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  validateLotData,
  async (req, res) => {
    try {
      const { name, description, commodityType, quantity, unit, quality, location, certifications, owner } = req.body

      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      const images = files.images || []
      const documents = files.documents || []

      // Upload images to IPFS
      const imageCIDs: string[] = []
      for (const image of images) {
        try {
          const cid = await ipfsService.uploadFile(image.buffer, image.originalname)
          imageCIDs.push(cid)
        } catch (error) {
          console.error("Failed to upload image:", error)
        }
      }

      // Upload documents to IPFS
      const documentCIDs: string[] = []
      for (const document of documents) {
        try {
          const cid = await ipfsService.uploadFile(document.buffer, document.originalname)
          documentCIDs.push(cid)
        } catch (error) {
          console.error("Failed to upload document:", error)
        }
      }

      // Create NFT metadata
      const metadataCID = await ipfsService.createNFTMetadata({
        name,
        description,
        commodityType,
        quantity: Number.parseInt(quantity),
        unit,
        quality,
        location,
        certifications: JSON.parse(certifications || "[]"),
        images: imageCIDs,
        documents: documentCIDs,
      })

      // Create lot record
      const lotId = `lot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const lot: LotData = {
        id: lotId,
        name,
        description,
        commodityType,
        quantity: Number.parseInt(quantity),
        unit,
        quality,
        location,
        certifications: JSON.parse(certifications || "[]"),
        images: imageCIDs,
        documents: documentCIDs,
        metadataURI: `ipfs://${metadataCID}`,
        createdAt: new Date().toISOString(),
        owner,
        status: "draft",
      }

      lots.set(lotId, lot)

      res.status(201).json({
        lot,
        ipfsUrls: {
          metadata: ipfsService.getIPFSUrl(metadataCID),
          images: imageCIDs.map((cid) => ipfsService.getIPFSUrl(cid)),
          documents: documentCIDs.map((cid) => ipfsService.getIPFSUrl(cid)),
        },
      })
    } catch (error) {
      console.error("Error creating lot:", error)
      res.status(500).json({ error: "Failed to create lot" })
    }
  },
)

/**
 * PUT /api/lots/:id - Update lot
 */
router.put("/:id", validateLotData, (req, res) => {
  try {
    const lot = lots.get(req.params.id)

    if (!lot) {
      return res.status(404).json({ error: "Lot not found" })
    }

    // Update lot data
    const updatedLot = {
      ...lot,
      ...req.body,
      id: lot.id, // Preserve ID
      createdAt: lot.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
    }

    lots.set(req.params.id, updatedLot)

    res.json(updatedLot)
  } catch (error) {
    console.error("Error updating lot:", error)
    res.status(500).json({ error: "Failed to update lot" })
  }
})

/**
 * DELETE /api/lots/:id - Delete lot
 */
router.delete("/:id", (req, res) => {
  try {
    const lot = lots.get(req.params.id)

    if (!lot) {
      return res.status(404).json({ error: "Lot not found" })
    }

    // Only allow deletion if not auctioned or sold
    if (lot.status === "auctioned" || lot.status === "sold") {
      return res.status(400).json({ error: "Cannot delete lot that is auctioned or sold" })
    }

    lots.delete(req.params.id)

    res.json({ message: "Lot deleted successfully" })
  } catch (error) {
    console.error("Error deleting lot:", error)
    res.status(500).json({ error: "Failed to delete lot" })
  }
})

/**
 * GET /api/lots/search - Search lots
 */
router.get("/search", (req, res) => {
  try {
    const { q, commodityType, location, minQuantity, maxQuantity } = req.query

    let results = Array.from(lots.values())

    // Text search
    if (q) {
      const query = (q as string).toLowerCase()
      results = results.filter(
        (lot) =>
          lot.name.toLowerCase().includes(query) ||
          lot.description.toLowerCase().includes(query) ||
          lot.commodityType.toLowerCase().includes(query),
      )
    }

    // Filters
    if (commodityType) {
      results = results.filter((lot) => lot.commodityType === commodityType)
    }

    if (location) {
      results = results.filter((lot) => lot.location.toLowerCase().includes((location as string).toLowerCase()))
    }

    if (minQuantity) {
      results = results.filter((lot) => lot.quantity >= Number.parseInt(minQuantity as string))
    }

    if (maxQuantity) {
      results = results.filter((lot) => lot.quantity <= Number.parseInt(maxQuantity as string))
    }

    res.json({
      results,
      count: results.length,
    })
  } catch (error) {
    console.error("Error searching lots:", error)
    res.status(500).json({ error: "Failed to search lots" })
  }
})

export { router as lotsRouter }
