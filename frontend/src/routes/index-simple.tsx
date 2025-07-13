import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: SimpleIndex,
})

function SimpleIndex() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          🧪 Science Competitions Insight
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover and manage science & technology competitions worldwide.
        </p>
        
        <div className="space-y-4">
          <button className="btn-primary px-6 py-3">
            Explore Competitions
          </button>
          <button className="btn-outline px-6 py-3 ml-4">
            Get AI Recommendations
          </button>
        </div>
        
        <div className="mt-12">
          <a href="/debug" className="text-blue-600 hover:underline">
            → Go to Debug Page
          </a>
        </div>
      </div>
    </div>
  )
} 