'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit2, Eye, Settings, FileText, MoreVertical, Zap, Search, Play, Pause, Check, X, ChevronDown, ChevronRight } from 'lucide-react'

// ============ TYPES ============
interface App {
  id: string
  name: string
  category: string
  description: string
  icon: string
}

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action'
  appId: string
  appName: string
  actionName: string
  config: Record<string, string>
}

interface Workflow {
  id: string
  name: string
  steps: WorkflowStep[]
  status: 'draft' | 'active' | 'paused'
  createdAt: string
  lastModified: string
}

interface ExecutionLog {
  id: string
  workflowId: string
  workflowName: string
  timestamp: string
  duration: string
  status: 'success' | 'failed' | 'running'
  steps: { app: string; action: string; status: string; error?: string }[]
}

// ============ CONSTANTS ============
const APPS: App[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    description: 'Email automation',
    icon: 'G',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Team messaging',
    icon: 'S',
  },
  {
    id: 'googlecalendar',
    name: 'Google Calendar',
    category: 'Productivity',
    description: 'Calendar management',
    icon: 'C',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Database & notes',
    icon: 'N',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Customer management',
    icon: 'H',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    description: 'Code repository',
    icon: 'G',
  },
]

const SAMPLE_WORKFLOWS: Workflow[] = [
  {
    id: '1',
    name: 'Gmail to Slack to Google Drive',
    steps: [
      {
        id: 'step-1',
        type: 'trigger',
        appId: 'gmail',
        appName: 'Gmail',
        actionName: 'New Email',
        config: { from: 'invoices@company.com' },
      },
      {
        id: 'step-2',
        type: 'action',
        appId: 'slack',
        appName: 'Slack',
        actionName: 'Send Message',
        config: { channel: '#finance' },
      },
      {
        id: 'step-3',
        type: 'action',
        appId: 'googlecalendar',
        appName: 'Google Calendar',
        actionName: 'Create Event',
        config: {},
      },
    ],
    status: 'active',
    createdAt: '2024-01-10',
    lastModified: '2024-01-15',
  },
  {
    id: '2',
    name: 'HubSpot to Notion Database',
    steps: [
      {
        id: 'step-1',
        type: 'trigger',
        appId: 'hubspot',
        appName: 'HubSpot',
        actionName: 'New Contact',
        config: {},
      },
      {
        id: 'step-2',
        type: 'action',
        appId: 'notion',
        appName: 'Notion',
        actionName: 'Create Page',
        config: { database: 'Contacts' },
      },
    ],
    status: 'active',
    createdAt: '2024-01-08',
    lastModified: '2024-01-12',
  },
]

const SAMPLE_LOGS: ExecutionLog[] = [
  {
    id: 'log-1',
    workflowId: '1',
    workflowName: 'Gmail to Slack to Google Drive',
    timestamp: '2024-01-15T14:32:00Z',
    duration: '2.5s',
    status: 'success',
    steps: [
      { app: 'Gmail', action: 'Fetch Email', status: 'success' },
      { app: 'Slack', action: 'Send Message', status: 'success' },
      { app: 'Google Calendar', action: 'Create Event', status: 'success' },
    ],
  },
  {
    id: 'log-2',
    workflowId: '2',
    workflowName: 'HubSpot to Notion Database',
    timestamp: '2024-01-15T14:15:00Z',
    duration: '1.8s',
    status: 'success',
    steps: [
      { app: 'HubSpot', action: 'Fetch Contact', status: 'success' },
      { app: 'Notion', action: 'Create Page', status: 'success' },
    ],
  },
]

// ============ APP SELECTOR COMPONENT ============
function AppSelector({ onSelect, isOpen, setIsOpen }: { onSelect: (app: App) => void; isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', ...new Set(APPS.map((a) => a.category))]
  const filtered = APPS.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose an App</DialogTitle>
          <DialogDescription>Select an app to add to your workflow</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search apps..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-3 pr-4">
              {filtered.map((app) => (
                <Card
                  key={app.id}
                  className="cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all"
                  onClick={() => {
                    onSelect(app)
                    setIsOpen(false)
                  }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600">{app.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============ WORKFLOW CANVAS COMPONENT ============
function WorkflowCanvas({
  workflow,
  onStepSelect,
  onAddStep,
  onDeleteStep,
}: {
  workflow: Workflow
  onStepSelect: (step: WorkflowStep) => void
  onAddStep: () => void
  onDeleteStep: (stepId: string) => void
}) {
  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="space-y-6">
        {workflow.steps.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No steps added yet</p>
            </div>
          </div>
        ) : (
          <>
            {workflow.steps.map((step, index) => (
              <div key={step.id} className="space-y-4">
                <div
                  className="bg-white rounded-lg border-2 border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all"
                  onClick={() => onStepSelect(step)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600">{APPS.find((a) => a.id === step.appId)?.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{step.appName}</p>
                        <p className="text-sm text-muted-foreground">{step.actionName}</p>
                      </div>
                      <Badge variant={step.type === 'trigger' ? 'default' : 'secondary'} className="capitalize">
                        {step.type}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation()
                      onDeleteStep(step.id)
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {index < workflow.steps.length - 1 && (
                  <div className="flex justify-center">
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={onAddStep} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Step
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============ STEP CONFIG PANEL COMPONENT ============
function StepConfigPanel({ step, onClose, onUpdate }: { step: WorkflowStep | null; onClose: () => void; onUpdate: (config: Record<string, string>) => void }) {
  const [config, setConfig] = useState<Record<string, string>>(step?.config || {})

  if (!step) return null

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{step.appName}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{step.actionName}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Action</label>
            <Select defaultValue={step.actionName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={step.actionName}>{step.actionName}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-foreground block mb-3">Configuration</label>
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className="space-y-2 mb-3">
                <label className="text-xs text-muted-foreground block capitalize">{key}</label>
                <Input
                  placeholder={`Enter ${key}`}
                  value={value}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                />
              </div>
            ))}

            {Object.keys(config).length === 0 && (
              <p className="text-sm text-muted-foreground">No configuration needed</p>
            )}
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-foreground block mb-3">Field Mapping</label>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Data from previous steps will appear here</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-6 border-t border-gray-200 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onUpdate(config)
            onClose()
          }}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

// ============ WORKFLOWS LIST COMPONENT ============
function WorkflowsList({ workflows, onNewWorkflow, onOpenWorkflow, onDeleteWorkflow }: { workflows: Workflow[]; onNewWorkflow: () => void; onOpenWorkflow: (workflow: Workflow) => void; onDeleteWorkflow: (id: string) => void }) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Zaps</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage your automated workflows</p>
        </div>
        <Button onClick={onNewWorkflow} className="gap-2" size="lg">
          <Plus className="w-4 h-4" />
          Create Zap
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onOpenWorkflow(workflow)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                    <Badge variant={workflow.status === 'active' ? 'default' : workflow.status === 'paused' ? 'secondary' : 'outline'}>
                      {workflow.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''} • Last modified {workflow.lastModified}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onOpenWorkflow(workflow)
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onDeleteWorkflow(workflow.id)
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============ WORKFLOW EDITOR COMPONENT ============
function WorkflowEditor({ workflow: initialWorkflow, onClose, onSave }: { workflow: Workflow | null; onClose: () => void; onSave: (workflow: Workflow) => void }) {
  const [workflow, setWorkflow] = useState<Workflow>(
    initialWorkflow || {
      id: 'new-' + Date.now(),
      name: 'New Zap',
      steps: [],
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    }
  )
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  const [showAppSelector, setShowAppSelector] = useState(false)
  const [workflowName, setWorkflowName] = useState(workflow.name)

  const handleAddStep = (app: App) => {
    const newStep: WorkflowStep = {
      id: 'step-' + Date.now(),
      type: workflow.steps.length === 0 ? 'trigger' : 'action',
      appId: app.id,
      appName: app.name,
      actionName: `${app.name} Action`,
      config: {},
    }
    setWorkflow({ ...workflow, steps: [...workflow.steps, newStep] })
    setSelectedStep(null)
  }

  const handleDeleteStep = (stepId: string) => {
    setWorkflow({ ...workflow, steps: workflow.steps.filter((s) => s.id !== stepId) })
    setSelectedStep(null)
  }

  const handleUpdateStep = (config: Record<string, string>) => {
    if (!selectedStep) return
    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((s) => (s.id === selectedStep.id ? { ...s, config } : s)),
    })
  }

  const handleSave = () => {
    const updatedWorkflow = {
      ...workflow,
      name: workflowName,
      lastModified: new Date().toISOString().split('T')[0],
    }
    onSave(updatedWorkflow)
    onClose()
  }

  return (
    <Dialog open={Boolean(initialWorkflow || showAppSelector)} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <Input
              placeholder="Zap name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-semibold border-0 p-0 h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Zap</Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <WorkflowCanvas
            workflow={workflow}
            onStepSelect={setSelectedStep}
            onAddStep={() => setShowAppSelector(true)}
            onDeleteStep={handleDeleteStep}
          />
          <StepConfigPanel step={selectedStep} onClose={() => setSelectedStep(null)} onUpdate={handleUpdateStep} />
        </div>
      </DialogContent>

      <AppSelector isOpen={showAppSelector} setIsOpen={setShowAppSelector} onSelect={handleAddStep} />
    </Dialog>
  )
}

// ============ MAIN APP ============
export default function HomePage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(SAMPLE_WORKFLOWS)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleSaveWorkflow = (workflow: Workflow) => {
    const index = workflows.findIndex((w) => w.id === workflow.id)
    if (index >= 0) {
      setWorkflows(workflows.map((w, i) => (i === index ? workflow : w)))
    } else {
      setWorkflows([...workflows, workflow])
    }
    setSelectedWorkflow(null)
  }

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id))
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <WorkflowsList workflows={workflows} onNewWorkflow={() => setSelectedWorkflow({ id: '', name: '', steps: [], status: 'draft', createdAt: '', lastModified: '' })} onOpenWorkflow={setSelectedWorkflow} onDeleteWorkflow={(id) => setDeleteConfirm(id)} />

      {selectedWorkflow && <WorkflowEditor workflow={selectedWorkflow && selectedWorkflow.id ? selectedWorkflow : null} onClose={() => setSelectedWorkflow(null)} onSave={handleSaveWorkflow} />}

      {deleteConfirm && (
        <AlertDialog open={true} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Zap</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteWorkflow(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
