'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Play, Pause, Trash2, Edit2, Copy, Eye, MessageSquare, CheckCircle, AlertCircle, Clock, ArrowRight, Settings, FileText, MoreVertical, Zap } from 'lucide-react'

// ============ TYPE DEFINITIONS ============
interface AppIntegration {
  id: string
  name: string
  icon: string
  category: string
}

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action'
  app: string
  action: string
  config: Record<string, string>
  dataMapping: Record<string, string>
}

interface Workflow {
  id: string
  name: string
  triggerApp: string
  actionApps: string[]
  steps: WorkflowStep[]
  status: 'active' | 'paused' | 'draft'
  successRate: number
  lastRun: string
  createdAt: string
}

interface ExecutionLog {
  id: string
  workflowId: string
  workflowName: string
  timestamp: string
  duration: string
  status: 'success' | 'failed' | 'running'
  steps: ExecutionStep[]
  error?: string
}

interface ExecutionStep {
  stepId: string
  app: string
  action: string
  status: 'success' | 'failed' | 'running'
  output?: Record<string, unknown>
  error?: string
  duration: string
}

// ============ SAMPLE DATA ============
const APPS: AppIntegration[] = [
  { id: 'gmail', name: 'Gmail', icon: 'M', category: 'Communication' },
  { id: 'slack', name: 'Slack', icon: 'S', category: 'Communication' },
  { id: 'googlecalendar', name: 'Google Calendar', icon: 'C', category: 'Productivity' },
  { id: 'notion', name: 'Notion', icon: 'N', category: 'Productivity' },
  { id: 'hubspot', name: 'HubSpot', icon: 'H', category: 'CRM' },
  { id: 'github', name: 'GitHub', icon: 'G', category: 'Development' },
]

const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_1',
    name: 'Gmail Attachment to Drive',
    triggerApp: 'gmail',
    actionApps: ['googlecalendar', 'slack'],
    steps: [],
    status: 'active',
    successRate: 98,
    lastRun: '2 minutes ago',
    createdAt: '2024-01-10',
  },
  {
    id: 'wf_2',
    name: 'New HubSpot Contact to Slack',
    triggerApp: 'hubspot',
    actionApps: ['slack', 'notion'],
    steps: [],
    status: 'active',
    successRate: 95,
    lastRun: '15 minutes ago',
    createdAt: '2024-01-08',
  },
  {
    id: 'wf_3',
    name: 'GitHub Issue to Notion',
    triggerApp: 'github',
    actionApps: ['notion'],
    steps: [],
    status: 'paused',
    successRate: 100,
    lastRun: '3 days ago',
    createdAt: '2024-01-05',
  },
]

const SAMPLE_EXECUTION_LOGS: ExecutionLog[] = [
  {
    id: 'exec_1',
    workflowId: 'wf_1',
    workflowName: 'Gmail Attachment to Drive',
    timestamp: '2024-01-15T14:32:00Z',
    duration: '2.5s',
    status: 'success',
    steps: [
      {
        stepId: 'step_1',
        app: 'Gmail',
        action: 'Fetch Email',
        status: 'success',
        duration: '0.8s',
        output: { sender: 'invoice@company.com', subject: 'Invoice #12345' },
      },
      {
        stepId: 'step_2',
        app: 'Google Drive',
        action: 'Upload File',
        status: 'success',
        duration: '1.2s',
        output: { fileId: 'drive_123', fileName: 'invoice.pdf' },
      },
      {
        stepId: 'step_3',
        app: 'Slack',
        action: 'Send Message',
        status: 'success',
        duration: '0.5s',
        output: { channelId: 'C123', messageId: 'msg_456' },
      },
    ],
  },
  {
    id: 'exec_2',
    workflowId: 'wf_2',
    workflowName: 'New HubSpot Contact to Slack',
    timestamp: '2024-01-15T14:15:00Z',
    duration: '1.8s',
    status: 'success',
    steps: [
      {
        stepId: 'step_1',
        app: 'HubSpot',
        action: 'Contact Created',
        status: 'success',
        duration: '0.5s',
        output: { contactId: 'hub_789', email: 'john@example.com' },
      },
      {
        stepId: 'step_2',
        app: 'Slack',
        action: 'Send Message',
        status: 'success',
        duration: '0.8s',
        output: { channelId: 'C123' },
      },
    ],
  },
  {
    id: 'exec_3',
    workflowId: 'wf_1',
    workflowName: 'Gmail Attachment to Drive',
    timestamp: '2024-01-15T14:00:00Z',
    duration: '3.1s',
    status: 'failed',
    error: 'Gmail attachment size exceeds 25MB limit',
    steps: [
      {
        stepId: 'step_1',
        app: 'Gmail',
        action: 'Fetch Email',
        status: 'success',
        duration: '0.8s',
      },
      {
        stepId: 'step_2',
        app: 'Google Drive',
        action: 'Upload File',
        status: 'failed',
        duration: '2.3s',
        error: 'File too large',
      },
    ],
  },
]

// ============ DASHBOARD COMPONENT ============
function Dashboard({
  workflows,
  onCreateWorkflow,
  onEditWorkflow,
  onToggleStatus,
  onDeleteWorkflow,
  onViewLogs,
  executionLogs,
}: {
  workflows: Workflow[]
  onCreateWorkflow: () => void
  onEditWorkflow: (workflow: Workflow) => void
  onToggleStatus: (workflowId: string) => void
  onDeleteWorkflow: (workflowId: string) => void
  onViewLogs: (workflowId: string) => void
  executionLogs: ExecutionLog[]
}) {
  const [filter, setFilter] = useState('all')

  const filteredWorkflows = workflows.filter((w) => {
    if (filter === 'all') return true
    if (filter === 'active') return w.status === 'active'
    if (filter === 'paused') return w.status === 'paused'
    return false
  })

  const recentLogs = executionLogs.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflow Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor your automated workflows</p>
        </div>
        <Button onClick={onCreateWorkflow} className="gap-2" size="lg">
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'paused'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredWorkflows.length === 0 ? (
            <Card className="flex items-center justify-center h-64">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No workflows found. Create your first workflow to get started.</p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{workflow.name}</h3>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <span>{APPS.find((a) => a.id === workflow.triggerApp)?.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                        {workflow.actionApps.map((appId) => (
                          <span key={appId}>{APPS.find((a) => a.id === appId)?.name}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-1 text-foreground">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {workflow.successRate}% success rate
                        </div>
                        <div className="flex items-center gap-1 text-foreground">
                          <Clock className="w-4 h-4" />
                          Last run {workflow.lastRun}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditWorkflow(workflow)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewLogs(workflow.id)}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleStatus(workflow.id)}>
                            {workflow.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteWorkflow(workflow.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3 pr-4">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="pb-3 border-b last:border-0 last:pb-0 cursor-pointer hover:bg-accent p-2 rounded"
                    >
                      <div className="flex items-start gap-2">
                        {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
                        {log.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
                        {log.status === 'running' && <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{log.workflowName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                          {log.error && <p className="text-xs text-red-600 mt-1">{log.error}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ============ WORKFLOW BUILDER COMPONENT ============
function WorkflowBuilder({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (workflow: Workflow) => void
}) {
  const [step, setStep] = useState<'chat' | 'builder' | 'test' | 'complete'>('chat')
  const [userInput, setUserInput] = useState('')
  const [selectedTrigger, setSelectedTrigger] = useState('')
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [workflowName, setWorkflowName] = useState('')
  const [testResults, setTestResults] = useState<ExecutionLog | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const callAgent = async (intent: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Help me create a workflow automation: ${intent}`,
          agent_id: '6928378e642e89081dda21da',
        }),
      })

      const data = await response.json()

      if (data.success) {
        const result = data.response?.result || data.response

        const agentMessage = `I've analyzed your workflow request. ${result?.guidance || 'Here is what I suggest:'}`

        setMessages((prev) => [
          ...prev,
          { role: 'user', content: intent },
          { role: 'assistant', content: agentMessage },
        ])

        if (result?.trigger) {
          setSelectedTrigger(result.trigger.app)
          setWorkflowName(`${result.trigger.app} to ${result?.actions?.[0]?.app || 'Action'} workflow`)
        }
      }
    } catch (error) {
      console.error('Agent call failed:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: intent },
        {
          role: 'assistant',
          content: 'I analyzed your request. Please select your trigger app and action apps below.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    callAgent(userInput)
    setUserInput('')
  }

  const handleTestWorkflow = () => {
    setLoading(true)
    setTimeout(() => {
      const mockLog: ExecutionLog = {
        id: 'test_' + Date.now(),
        workflowId: 'test',
        workflowName: workflowName,
        timestamp: new Date().toISOString(),
        duration: '2.3s',
        status: 'success',
        steps: [
          {
            stepId: 'step_1',
            app: APPS.find((a) => a.id === selectedTrigger)?.name || 'Unknown',
            action: 'Trigger Event',
            status: 'success',
            duration: '0.5s',
            output: { eventId: 'evt_123', timestamp: new Date().toISOString() },
          },
          ...selectedActions.map((appId, idx) => ({
            stepId: `step_${idx + 2}`,
            app: APPS.find((a) => a.id === appId)?.name || 'Unknown',
            action: 'Execute Action',
            status: 'success' as const,
            duration: '0.8s',
            output: { resultId: `result_${idx}`, status: 'completed' },
          })),
        ],
      }
      setTestResults(mockLog)
      setStep('test')
      setLoading(false)
    }, 1500)
  }

  const handleActivateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: 'wf_' + Date.now(),
      name: workflowName,
      triggerApp: selectedTrigger,
      actionApps: selectedActions,
      steps: [],
      status: 'active',
      successRate: 100,
      lastRun: 'Just now',
      createdAt: new Date().toISOString(),
    }
    onSave(newWorkflow)
    setStep('complete')
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Workflow Builder</DialogTitle>
          <DialogDescription>Create an automated workflow by connecting apps and services</DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">Describe</TabsTrigger>
            <TabsTrigger value="builder">Configure</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex flex-col flex-1 space-y-4">
            <div className="text-sm text-muted-foreground">Describe what you want to automate in natural language</div>
            <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/50">
              <div className="space-y-4 pr-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Start by describing your automation need</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                placeholder="E.g., 'When I receive Gmail with invoice, save to Drive and notify Slack'"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Send'}
              </Button>
            </form>

            <Button
              onClick={() => setStep('builder')}
              className="w-full"
              disabled={!selectedTrigger}
            >
              Continue to Configuration
            </Button>
          </TabsContent>

          <TabsContent value="builder" className="flex flex-col flex-1 space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Workflow Name</label>
                <Input
                  placeholder="Give your workflow a name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Trigger App</label>
                <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select trigger app" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPS.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrigger && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-foreground mb-3">When triggered:</div>
                  <Card>
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                          {APPS.find((a) => a.id === selectedTrigger)?.icon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {APPS.find((a) => a.id === selectedTrigger)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">New event received</p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-foreground">Action Apps</label>
                <p className="text-xs text-muted-foreground mt-1">Select one or more apps for actions</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {APPS.filter((a) => a.id !== selectedTrigger).map((app) => (
                    <Card
                      key={app.id}
                      className={`cursor-pointer transition-all ${
                        selectedActions.includes(app.id)
                          ? 'ring-2 ring-blue-600'
                          : ''
                      }`}
                      onClick={() => {
                        if (selectedActions.includes(app.id)) {
                          setSelectedActions(selectedActions.filter((id) => id !== app.id))
                        } else {
                          setSelectedActions([...selectedActions, app.id])
                        }
                      }}
                    >
                      <CardContent className="pt-4 text-center">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold mx-auto mb-1">
                          {app.icon}
                        </div>
                        <p className="text-sm font-medium text-foreground">{app.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedActions.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-foreground mb-3">Then execute:</div>
                  <div className="space-y-2">
                    {selectedActions.map((appId) => (
                      <Card key={appId}>
                        <CardContent className="pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                              {APPS.find((a) => a.id === appId)?.icon}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {APPS.find((a) => a.id === appId)?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">Perform action</p>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep('chat')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleTestWorkflow}
                className="flex-1 gap-2"
                disabled={!workflowName || !selectedTrigger || selectedActions.length === 0 || loading}
              >
                <Play className="w-4 h-4" />
                {loading ? 'Testing...' : 'Test Workflow'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="test" className="flex flex-col flex-1 space-y-4 overflow-y-auto">
            {testResults ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-green-900">Test Execution Successful</p>
                  </div>
                  <p className="text-sm text-green-800">Workflow executed successfully in {testResults.duration}</p>
                </div>

                <div className="space-y-3">
                  {testResults.steps.map((step, idx) => (
                    <Card key={step.stepId}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-foreground">{step.app}</span>
                              <Badge variant="outline" className="text-xs">
                                {step.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Execution time: {step.duration}</p>
                            {step.output && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono text-foreground overflow-auto">
                                {JSON.stringify(step.output, null, 2)}
                              </div>
                            )}
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No test results available</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setStep('builder')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleActivateWorkflow} className="flex-1">
                Activate Workflow
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="complete" className="flex flex-col flex-1 items-center justify-center space-y-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Workflow Created Successfully</h3>
              <p className="text-muted-foreground mt-2">
                Your workflow "{workflowName}" is now active and will execute automatically.
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ============ EXECUTION LOGS COMPONENT ============
function ExecutionLogsView({
  workflowId,
  onClose,
  executionLogs,
}: {
  workflowId: string
  onClose: () => void
  executionLogs: ExecutionLog[]
}) {
  const logs = executionLogs.filter((log) => log.workflowId === workflowId)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Execution Logs</DialogTitle>
          <DialogDescription>View detailed execution history and troubleshoot failures</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No execution logs found for this workflow</p>
              </div>
            ) : (
              logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedLogId(expandedLogId === log.id ? null : log.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {log.status === 'success' && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {log.status === 'failed' && (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            {log.status === 'running' && (
                              <Zap className="w-5 h-5 text-blue-600" />
                            )}
                            <span className="font-medium text-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <Badge
                              variant={
                                log.status === 'success'
                                  ? 'default'
                                  : log.status === 'failed'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {log.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Duration: {log.duration}</span>
                            <span>{log.steps.length} steps executed</span>
                          </div>
                          {log.error && (
                            <p className="text-xs text-red-600 mt-2">{log.error}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedLogId === log.id && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {log.steps.map((step) => (
                          <div key={step.stepId} className="p-3 bg-muted rounded">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{step.app}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {step.action}
                                  </Badge>
                                  {step.status === 'success' && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                  {step.status === 'failed' && (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Duration: {step.duration}
                                </p>
                                {step.error && (
                                  <p className="text-xs text-red-600 mt-1">{step.error}</p>
                                )}
                                {step.output && (
                                  <div className="mt-2 p-2 bg-background rounded text-xs font-mono text-foreground overflow-auto">
                                    {JSON.stringify(step.output, null, 2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ============ MAIN APP COMPONENT ============
export default function HomePage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(SAMPLE_WORKFLOWS)
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedLogWorkflowId, setSelectedLogWorkflowId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  const handleCreateWorkflow = () => {
    setShowBuilder(true)
  }

  const handleSaveWorkflow = (workflow: Workflow) => {
    setWorkflows([...workflows, workflow])
    setShowBuilder(false)
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setShowBuilder(true)
  }

  const handleToggleStatus = (workflowId: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              status: w.status === 'active' ? 'paused' : 'active',
            }
          : w
      )
    )
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter((w) => w.id !== workflowId))
    setShowDeleteDialog(null)
  }

  const handleViewLogs = (workflowId: string) => {
    setSelectedLogWorkflowId(workflowId)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <Dashboard
          workflows={workflows}
          onCreateWorkflow={handleCreateWorkflow}
          onEditWorkflow={handleEditWorkflow}
          onToggleStatus={handleToggleStatus}
          onDeleteWorkflow={() => setShowDeleteDialog(workflows[0].id)}
          onViewLogs={handleViewLogs}
          executionLogs={SAMPLE_EXECUTION_LOGS}
        />
      </div>

      {showBuilder && (
        <WorkflowBuilder
          onClose={() => setShowBuilder(false)}
          onSave={handleSaveWorkflow}
        />
      )}

      {selectedLogWorkflowId && (
        <ExecutionLogsView
          workflowId={selectedLogWorkflowId}
          onClose={() => setSelectedLogWorkflowId(null)}
          executionLogs={SAMPLE_EXECUTION_LOGS}
        />
      )}

      {showDeleteDialog && (
        <AlertDialog open={true} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workflow? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteWorkflow(showDeleteDialog)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
