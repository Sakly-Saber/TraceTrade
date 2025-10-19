// n8n Workflow Automation for TraceTrade
// This module handles workflow automation using n8n integration

export interface WorkflowTrigger {
  id: string
  name: string
  description: string
  event: string
  conditions?: Record<string, any>
  active: boolean
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "running" | "success" | "error" | "waiting"
  startTime: Date
  endTime?: Date
  data: Record<string, any>
  error?: string
}

export interface NotificationConfig {
  email?: {
    enabled: boolean
    recipients: string[]
    template: string
  }
  sms?: {
    enabled: boolean
    recipients: string[]
    template: string
  }
  webhook?: {
    enabled: boolean
    url: string
    headers?: Record<string, string>
  }
  slack?: {
    enabled: boolean
    channel: string
    webhook: string
  }
}

class N8nWorkflowManager {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || "http://localhost:5678"
    this.apiKey = process.env.N8N_API_KEY || ""
  }

  // Predefined workflow templates for TraceTrade
  getWorkflowTemplates() {
    return {
      auctionLifecycle: {
        id: "auction-lifecycle",
        name: "Auction Lifecycle Management",
        description: "Automates auction creation, monitoring, and settlement processes",
        triggers: ["auction.created", "auction.started", "bid.placed", "auction.ended", "auction.settled"],
        actions: ["send_notifications", "update_inventory", "process_payments", "generate_reports", "update_crm"],
      },

      complianceCheck: {
        id: "compliance-check",
        name: "KYC & Compliance Automation",
        description: "Automated compliance checks for new users and high-value transactions",
        triggers: ["user.registered", "bid.high_value", "auction.high_value"],
        actions: [
          "verify_identity",
          "check_sanctions_list",
          "validate_documents",
          "flag_suspicious_activity",
          "notify_compliance_team",
        ],
      },

      paymentProcessing: {
        id: "payment-processing",
        name: "Payment Processing Automation",
        description: "Handles payment verification, processing, and reconciliation",
        triggers: ["auction.won", "payment.received", "payment.failed"],
        actions: ["verify_payment", "release_escrow", "transfer_nft", "update_accounting", "send_receipts"],
      },

      inventoryManagement: {
        id: "inventory-management",
        name: "Inventory & Asset Management",
        description: "Manages physical asset tracking and inventory updates",
        triggers: ["lot.created", "auction.settled", "shipment.dispatched", "delivery.confirmed"],
        actions: [
          "update_inventory",
          "track_shipment",
          "notify_logistics",
          "update_asset_status",
          "generate_shipping_docs",
        ],
      },

      marketAnalytics: {
        id: "market-analytics",
        name: "Market Analytics & Reporting",
        description: "Automated market analysis and reporting workflows",
        triggers: ["auction.completed", "daily.schedule", "weekly.schedule", "market.volatility"],
        actions: [
          "analyze_market_trends",
          "generate_reports",
          "update_dashboards",
          "send_market_alerts",
          "backup_data",
        ],
      },
    }
  }

  // Execute workflow via n8n webhook
  async executeWorkflow(workflowId: string, data: Record<string, any>): Promise<WorkflowExecution> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/${workflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Workflow execution failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        id: result.executionId || `exec_${Date.now()}`,
        workflowId,
        status: "running",
        startTime: new Date(),
        data: result,
      }
    } catch (error) {
      console.error("Workflow execution error:", error)
      throw error
    }
  }

  // Trigger auction lifecycle workflow
  async triggerAuctionWorkflow(event: string, auctionData: any) {
    const workflowData = {
      event,
      auction: auctionData,
      timestamp: new Date().toISOString(),
      source: "tracetrade-marketplace",
    }

    return this.executeWorkflow("auction-lifecycle", workflowData)
  }

  // Trigger compliance workflow
  async triggerComplianceWorkflow(event: string, userData: any, transactionData?: any) {
    const workflowData = {
      event,
      user: userData,
      transaction: transactionData,
      timestamp: new Date().toISOString(),
      riskLevel: this.calculateRiskLevel(userData, transactionData),
    }

    return this.executeWorkflow("compliance-check", workflowData)
  }

  // Trigger payment workflow
  async triggerPaymentWorkflow(event: string, paymentData: any) {
    const workflowData = {
      event,
      payment: paymentData,
      timestamp: new Date().toISOString(),
      currency: paymentData.currency || "HBAR",
    }

    return this.executeWorkflow("payment-processing", workflowData)
  }

  // Send notifications via workflow
  async sendNotification(type: string, recipients: string[], data: any, config: NotificationConfig) {
    const notificationData = {
      type,
      recipients,
      data,
      config,
      timestamp: new Date().toISOString(),
    }

    return this.executeWorkflow("notification-sender", notificationData)
  }

  // Generate workflow configuration for n8n
  generateWorkflowConfig(templateId: string, customizations?: Record<string, any>) {
    const templates = this.getWorkflowTemplates()
    const template = templates[templateId as keyof typeof templates]

    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`)
    }

    return {
      name: template.name,
      nodes: this.generateWorkflowNodes(template, customizations),
      connections: this.generateWorkflowConnections(template),
      settings: {
        executionOrder: "v1",
      },
      staticData: null,
      tags: ["tracetrade", "b2b-marketplace", template.id],
      triggerCount: 1,
      updatedAt: new Date().toISOString(),
      versionId: 1,
    }
  }

  private generateWorkflowNodes(template: any, customizations?: Record<string, any>) {
    const baseNodes = [
      {
        parameters: {
          httpMethod: "POST",
          path: `/${template.id}`,
          responseMode: "onReceived",
          options: {},
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 300],
        webhookId: template.id,
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: '={{$json["event"]}}',
                operation: "equal",
                value2: template.triggers[0],
              },
            ],
          },
        },
        name: "Event Filter",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [450, 300],
      },
    ]

    // Add action nodes based on template
    template.actions.forEach((action: string, index: number) => {
      baseNodes.push({
        parameters: this.getActionParameters(action, customizations),
        name: this.formatActionName(action),
        type: this.getActionNodeType(action),
        typeVersion: 1,
        position: [650 + index * 200, 300],
      })
    })

    return baseNodes
  }

  private generateWorkflowConnections(template: any) {
    const connections: Record<string, any> = {
      Webhook: {
        main: [
          [
            {
              node: "Event Filter",
              type: "main",
              index: 0,
            },
          ],
        ],
      },
    }

    // Connect event filter to first action
    if (template.actions.length > 0) {
      connections["Event Filter"] = {
        main: [
          [
            {
              node: this.formatActionName(template.actions[0]),
              type: "main",
              index: 0,
            },
          ],
        ],
      }
    }

    // Chain actions together
    template.actions.forEach((action: string, index: number) => {
      if (index < template.actions.length - 1) {
        const currentAction = this.formatActionName(action)
        const nextAction = this.formatActionName(template.actions[index + 1])

        connections[currentAction] = {
          main: [
            [
              {
                node: nextAction,
                type: "main",
                index: 0,
              },
            ],
          ],
        }
      }
    })

    return connections
  }

  private getActionParameters(action: string, customizations?: Record<string, any>) {
    const defaultParams: Record<string, any> = {
      send_notifications: {
        resource: "email",
        operation: "send",
        to: '={{$json["recipients"]}}',
        subject: "TraceTrade Notification",
        message: '={{$json["message"]}}',
      },
      update_inventory: {
        resource: "database",
        operation: "update",
        table: "inventory",
        updateKey: "lot_id",
        columnsUi: {
          columnToMatchOn: "lot_id",
          valueToMatchOn: '={{$json["lot_id"]}}',
          columns: [
            {
              column: "status",
              value: '={{$json["status"]}}',
            },
          ],
        },
      },
      process_payments: {
        operation: "create",
        resource: "payment",
        amount: '={{$json["amount"]}}',
        currency: '={{$json["currency"]}}',
        recipient: '={{$json["recipient"]}}',
      },
    }

    return { ...defaultParams[action], ...customizations?.[action] }
  }

  private getActionNodeType(action: string): string {
    const nodeTypes: Record<string, string> = {
      send_notifications: "n8n-nodes-base.emailSend",
      update_inventory: "n8n-nodes-base.postgres",
      process_payments: "n8n-nodes-base.httpRequest",
      generate_reports: "n8n-nodes-base.function",
      verify_identity: "n8n-nodes-base.httpRequest",
      track_shipment: "n8n-nodes-base.httpRequest",
    }

    return nodeTypes[action] || "n8n-nodes-base.function"
  }

  private formatActionName(action: string): string {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  private calculateRiskLevel(userData: any, transactionData?: any): "low" | "medium" | "high" {
    let riskScore = 0

    // User risk factors
    if (!userData.verified) riskScore += 2
    if (userData.accountAge < 30) riskScore += 1
    if (userData.previousViolations > 0) riskScore += 3

    // Transaction risk factors
    if (transactionData) {
      if (transactionData.amount > 1000000) riskScore += 2
      if (transactionData.crossBorder) riskScore += 1
      if (transactionData.highRiskCountry) riskScore += 3
    }

    if (riskScore >= 5) return "high"
    if (riskScore >= 3) return "medium"
    return "low"
  }
}

// Export singleton instance
export const n8nWorkflowManager = new N8nWorkflowManager()

// Workflow event types
export const WorkflowEvents = {
  AUCTION_CREATED: "auction.created",
  AUCTION_STARTED: "auction.started",
  BID_PLACED: "bid.placed",
  AUCTION_ENDED: "auction.ended",
  AUCTION_SETTLED: "auction.settled",
  USER_REGISTERED: "user.registered",
  PAYMENT_RECEIVED: "payment.received",
  PAYMENT_FAILED: "payment.failed",
  HIGH_VALUE_BID: "bid.high_value",
  COMPLIANCE_FLAG: "compliance.flag",
  SHIPMENT_DISPATCHED: "shipment.dispatched",
  DELIVERY_CONFIRMED: "delivery.confirmed",
} as const

// Utility functions
export const createWorkflowTrigger = (
  event: string,
  data: Record<string, any>,
  conditions?: Record<string, any>,
): WorkflowTrigger => ({
  id: `trigger_${Date.now()}`,
  name: `${event} Trigger`,
  description: `Automated trigger for ${event}`,
  event,
  conditions,
  active: true,
})

export const formatWorkflowData = (event: string, payload: Record<string, any>) => ({
  event,
  timestamp: new Date().toISOString(),
  source: "tracetrade",
  data: payload,
  metadata: {
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  },
})

// Enhanced image generation service using hosted n8n workflow
export const generateAssetImage = async (
  assetName: string, 
  assetDescription: string, 
  category: string,
  quantity?: number,
  unit?: string
): Promise<{imageUrl: string, imageCID: string}> => {
  const quantityText = quantity && unit ? ` x${quantity}${unit}` : ''
  const prompt = `${assetName} ${assetDescription} ${category}${quantityText} professional B2B glassmorphic NFT asset`
  
  // Use your hosted n8n webhook URL
  const webhookUrl = `http://34.27.185.196:5678/webhook/28cf0ecf-a1aa-4264-9e62-34e9751f3ad6?prompt=${encodeURIComponent(prompt)}`
  
  try {
    console.log('🎨 Triggering hosted n8n workflow...')
    console.log('📍 Webhook URL:', webhookUrl)
    console.log('📝 Prompt:', prompt)
    
    // Trigger the n8n workflow
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HederaB2B-Marketplace/1.0'
      },
    })
    
    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ n8n workflow response:', result)
    
    // Check if we received the expected data structure
    if (result && result.imageCID && result.imageUrl) {
      return {
        imageUrl: result.imageUrl,
        imageCID: result.imageCID
      }
    } else if (result && result.message) {
      // n8n might return a simple acknowledgment, wait for webhook
      console.log('⏳ Workflow triggered, waiting for webhook response...')
      throw new Error('Workflow triggered but no immediate result. Check webhook endpoint.')
    } else {
      throw new Error('Invalid response format from n8n workflow')
    }
    
  } catch (error) {
    console.error('❌ n8n workflow trigger failed:', error)
    throw error
  }
}
