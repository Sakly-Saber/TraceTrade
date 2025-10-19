import { Router } from "express"
import { n8nWorkflowManager, formatWorkflowData } from "../../lib/n8n-workflows"
import { validateRequest } from "../middleware/validation"
import { z } from "zod"

const router = Router()

// Get available workflow templates
router.get("/templates", (req, res) => {
  try {
    const templates = n8nWorkflowManager.getWorkflowTemplates()
    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch workflow templates",
    })
  }
})

// Generate workflow configuration
const generateConfigSchema = z.object({
  templateId: z.string(),
  customizations: z.record(z.any()).optional(),
})

router.post("/generate-config", validateRequest(generateConfigSchema), (req, res) => {
  try {
    const { templateId, customizations } = req.body
    const config = n8nWorkflowManager.generateWorkflowConfig(templateId, customizations)

    res.json({
      success: true,
      data: config,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate workflow config",
    })
  }
})

// Execute workflow manually
const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  data: z.record(z.any()),
})

router.post("/execute", validateRequest(executeWorkflowSchema), async (req, res) => {
  try {
    const { workflowId, data } = req.body
    const execution = await n8nWorkflowManager.executeWorkflow(workflowId, data)

    res.json({
      success: true,
      data: execution,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute workflow",
    })
  }
})

// Webhook endpoints for external systems to trigger workflows
router.post("/webhook/auction/:event", async (req, res) => {
  try {
    const { event } = req.params
    const auctionData = req.body

    const workflowData = formatWorkflowData(`auction.${event}`, auctionData)
    const execution = await n8nWorkflowManager.triggerAuctionWorkflow(`auction.${event}`, workflowData)

    res.json({
      success: true,
      executionId: execution.id,
      message: `Auction ${event} workflow triggered`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger auction workflow",
    })
  }
})

router.post("/webhook/compliance/:event", async (req, res) => {
  try {
    const { event } = req.params
    const { user, transaction } = req.body

    const execution = await n8nWorkflowManager.triggerComplianceWorkflow(`compliance.${event}`, user, transaction)

    res.json({
      success: true,
      executionId: execution.id,
      message: `Compliance ${event} workflow triggered`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger compliance workflow",
    })
  }
})

router.post("/webhook/payment/:event", async (req, res) => {
  try {
    const { event } = req.params
    const paymentData = req.body

    const execution = await n8nWorkflowManager.triggerPaymentWorkflow(`payment.${event}`, paymentData)

    res.json({
      success: true,
      executionId: execution.id,
      message: `Payment ${event} workflow triggered`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger payment workflow",
    })
  }
})

// Send notifications via workflow
const notificationSchema = z.object({
  type: z.enum(["email", "sms", "webhook", "slack"]),
  recipients: z.array(z.string()),
  data: z.record(z.any()),
  config: z.object({
    email: z
      .object({
        enabled: z.boolean(),
        recipients: z.array(z.string()),
        template: z.string(),
      })
      .optional(),
    sms: z
      .object({
        enabled: z.boolean(),
        recipients: z.array(z.string()),
        template: z.string(),
      })
      .optional(),
    webhook: z
      .object({
        enabled: z.boolean(),
        url: z.string(),
        headers: z.record(z.string()).optional(),
      })
      .optional(),
    slack: z
      .object({
        enabled: z.boolean(),
        channel: z.string(),
        webhook: z.string(),
      })
      .optional(),
  }),
})

router.post("/notify", validateRequest(notificationSchema), async (req, res) => {
  try {
    const { type, recipients, data, config } = req.body

    const execution = await n8nWorkflowManager.sendNotification(type, recipients, data, config)

    res.json({
      success: true,
      executionId: execution.id,
      message: "Notification workflow triggered",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    })
  }
})

// Workflow status and monitoring
router.get("/executions/:executionId", async (req, res) => {
  try {
    const { executionId } = req.params

    // In a real implementation, you would fetch execution status from n8n
    // For now, return mock data
    const execution = {
      id: executionId,
      status: "success",
      startTime: new Date(Date.now() - 60000).toISOString(),
      endTime: new Date().toISOString(),
      duration: 60000,
      data: {
        processed: true,
        steps: 5,
        success: true,
      },
    }

    res.json({
      success: true,
      data: execution,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch execution status",
    })
  }
})

// List recent workflow executions
router.get("/executions", async (req, res) => {
  try {
    const { limit = 10, offset = 0, status } = req.query

    // Mock execution data - in real implementation, fetch from n8n
    const executions = Array.from({ length: Number(limit) }, (_, i) => ({
      id: `exec_${Date.now() - i * 1000}`,
      workflowId: "auction-lifecycle",
      status: ["success", "running", "error"][i % 3],
      startTime: new Date(Date.now() - i * 60000).toISOString(),
      endTime: i % 3 !== 1 ? new Date(Date.now() - i * 60000 + 30000).toISOString() : null,
      duration: i % 3 !== 1 ? 30000 : null,
    }))

    res.json({
      success: true,
      data: {
        executions: status ? executions.filter((e) => e.status === status) : executions,
        total: 100,
        limit: Number(limit),
        offset: Number(offset),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch executions",
    })
  }
})

export default router
