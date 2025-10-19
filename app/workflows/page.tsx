import { Navigation } from "@/components/navigation"
import { WorkflowDashboard } from "@/components/workflow-dashboard"

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <WorkflowDashboard />
      </div>
    </div>
  )
}
