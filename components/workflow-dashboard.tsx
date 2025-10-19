"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Workflow,
  Play,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  Bell,
  Shield,
  DollarSign,
} from "lucide-react"

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  triggers: string[]
  actions: string[]
  active?: boolean
  executions?: number
  successRate?: number
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: "running" | "success" | "error" | "waiting"
  startTime: string
  endTime?: string
  duration?: number
}

export function WorkflowDashboard() {
  const [templates, setTemplates] = useState<Record<string, WorkflowTemplate>>({})
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadWorkflowData()
  }, [])

  const loadWorkflowData = async () => {
    try {
      // Load workflow templates
      const templatesResponse = await fetch("/api/workflows/templates")
      const templatesData = await templatesResponse.json()

      if (templatesData.success) {
        setTemplates(templatesData.data)
      }

      // Load recent executions
      const executionsResponse = await fetch("/api/workflows/executions?limit=20")
      const executionsData = await executionsResponse.json()

      if (executionsData.success) {
        setExecutions(executionsData.data.executions)
      }
    } catch (error) {
      console.error("Failed to load workflow data:", error)
    } finally {
      setLoading(false)
    }
  }

  const executeWorkflow = async (workflowId: string, data: Record<string, any> = {}) => {
    try {
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, data }),
      })

      const result = await response.json()

      if (result.success) {
        // Refresh executions
        loadWorkflowData()
      }
    } catch (error) {
      console.error("Failed to execute workflow:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      error: "destructive",
      running: "secondary",
      waiting: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status.toUpperCase()}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    )
  }

  const templateArray = Object.values(templates)
  const successfulExecutions = executions.filter((e) => e.status === "success").length
  const failedExecutions = executions.filter((e) => e.status === "error").length
  const runningExecutions = executions.filter((e) => e.status === "running").length
  const successRate = executions.length > 0 ? (successfulExecutions / executions.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">Manage and monitor n8n workflow automations</p>
        </div>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateArray.length}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Workflow className="h-4 w-4 mr-1" />
              Templates available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{runningExecutions}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="h-4 w-4 mr-1" />
              Currently executing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions.length}</div>
            <div className="text-sm text-muted-foreground">
              {successfulExecutions} success, {failedExecutions} failed
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Recent Activity</CardTitle>
                <CardDescription>Latest workflow executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executions.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <p className="font-medium">{execution.workflowId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.startTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(execution.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Quick Actions</CardTitle>
                <CardDescription>Common workflow operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => executeWorkflow("auction-lifecycle", { test: true })}
                >
                  <Play className="h-4 w-4" />
                  Test Auction Workflow
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => executeWorkflow("compliance-check", { test: true })}
                >
                  <Shield className="h-4 w-4" />
                  Test Compliance Check
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => executeWorkflow("payment-processing", { test: true })}
                >
                  <DollarSign className="h-4 w-4" />
                  Test Payment Processing
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Bell className="h-4 w-4" />
                  Send Test Notification
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateArray.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-lg">{template.name}</CardTitle>
                    <Badge variant={template.active ? "default" : "secondary"}>
                      {template.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Triggers ({template.triggers.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {template.triggers.slice(0, 3).map((trigger) => (
                        <Badge key={trigger} variant="outline" className="text-xs">
                          {trigger}
                        </Badge>
                      ))}
                      {template.triggers.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.triggers.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Actions ({template.actions.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {template.actions.slice(0, 3).map((action) => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {action.replace("_", " ")}
                        </Badge>
                      ))}
                      {template.actions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.actions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 gap-2" onClick={() => executeWorkflow(template.id)}>
                      <Play className="h-3 w-3" />
                      Execute
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Settings className="h-3 w-3" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Execution History</CardTitle>
              <CardDescription>Recent workflow executions and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-medium">{execution.workflowId}</p>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(execution.startTime).toLocaleString()}
                        </p>
                        {execution.endTime && (
                          <p className="text-sm text-muted-foreground">
                            Duration: {execution.duration ? `${execution.duration / 1000}s` : "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(execution.status)}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Duration</span>
                    <span>45s</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span>{((failedExecutions / executions.length) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(failedExecutions / executions.length) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">n8n Connection</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Webhook Endpoints</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Queue Status</span>
                  <Badge variant="secondary">Processing</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Health Check</span>
                  <span className="text-sm text-muted-foreground">2 minutes ago</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              All workflow systems are operating normally. Last system check completed successfully.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
