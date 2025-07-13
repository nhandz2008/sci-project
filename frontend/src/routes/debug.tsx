import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/debug')({
  component: DebugPage,
})

function DebugPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 Debug Page</h1>
      <p>If you can see this, React is working!</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('JavaScript is working!')}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test JavaScript
        </button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#007bff' }}>← Back to Home</a>
      </div>
    </div>
  )
} 