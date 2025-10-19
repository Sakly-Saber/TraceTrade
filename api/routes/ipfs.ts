import { Router } from "express"
import multer from "multer"
import { ipfsService } from "../services/ipfs"

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1,
  },
})

/**
 * POST /api/ipfs/upload - Upload file to IPFS
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }

    const cid = await ipfsService.uploadFile(req.file.buffer, req.file.originalname)
    const ipfsUrl = ipfsService.getIPFSUrl(cid)

    res.json({
      success: true,
      cid,
      ipfsUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
  } catch (error) {
    console.error("IPFS upload error:", error)
    res.status(500).json({ error: "Failed to upload file to IPFS" })
  }
})

/**
 * POST /api/ipfs/metadata - Upload JSON metadata to IPFS
 */
router.post("/metadata", async (req, res) => {
  try {
    const metadata = req.body

    if (!metadata || typeof metadata !== "object") {
      return res.status(400).json({ error: "Invalid metadata" })
    }

    const cid = await ipfsService.uploadMetadata(metadata)
    const ipfsUrl = ipfsService.getIPFSUrl(cid)

    res.json({
      success: true,
      cid,
      ipfsUrl,
      metadata,
    })
  } catch (error) {
    console.error("IPFS metadata upload error:", error)
    res.status(500).json({ error: "Failed to upload metadata to IPFS" })
  }
})

/**
 * GET /api/ipfs/:cid - Get IPFS URL for CID
 */
router.get("/:cid", (req, res) => {
  try {
    const { cid } = req.params

    if (!cid) {
      return res.status(400).json({ error: "CID required" })
    }

    const ipfsUrl = ipfsService.getIPFSUrl(cid)

    res.json({
      cid,
      ipfsUrl,
    })
  } catch (error) {
    console.error("IPFS URL error:", error)
    res.status(500).json({ error: "Failed to generate IPFS URL" })
  }
})

/**
 * POST /api/ipfs/pin/:cid - Pin content to IPFS
 */
router.post("/pin/:cid", async (req, res) => {
  try {
    const { cid } = req.params

    if (!cid) {
      return res.status(400).json({ error: "CID required" })
    }

    const success = await ipfsService.pinContent(cid)

    if (success) {
      res.json({
        success: true,
        cid,
        message: "Content pinned successfully",
      })
    } else {
      res.status(500).json({ error: "Failed to pin content" })
    }
  } catch (error) {
    console.error("IPFS pin error:", error)
    res.status(500).json({ error: "Failed to pin content" })
  }
})

export { router as ipfsRouter }
