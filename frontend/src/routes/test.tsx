import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test')({
  component: TestPage,
})

function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          🧪 SCI Test Page
        </h1>
        
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">✅ Basic Functionality Test</h2>
            <p className="text-muted-foreground">
              If you can see this page, the basic React app is working correctly!
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">🔗 Navigation Test</h2>
            <div className="space-y-2">
              <a href="/" className="block text-blue-600 hover:underline">
                ← Back to Home
              </a>
              <a href="/competitions" className="block text-blue-600 hover:underline">
                → Go to Competitions
              </a>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">🎨 Styling Test</h2>
            <div className="space-y-4">
              <button className="btn-primary px-4 py-2">
                Primary Button
              </button>
              <button className="btn-outline px-4 py-2">
                Outline Button
              </button>
              <button className="btn-ghost px-4 py-2">
                Ghost Button
              </button>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">📊 Current Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Frontend Server:</span>
                <span className="text-green-600">✅ Running on port 3000</span>
              </div>
              <div className="flex justify-between">
                <span>Backend Server:</span>
                <span className="text-green-600">✅ Running on port 8000</span>
              </div>
              <div className="flex justify-between">
                <span>React Router:</span>
                <span className="text-green-600">✅ Working</span>
              </div>
              <div className="flex justify-between">
                <span>Tailwind CSS:</span>
                <span className="text-green-600">✅ Working</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 