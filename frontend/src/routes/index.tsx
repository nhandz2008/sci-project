import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="container mx-auto container-padding">
      <div className="section-spacing text-center">
        <h1 className="mb-6">Science Competitions Insight</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover and manage science & technology competitions worldwide. 
          Connect with opportunities that match your interests and expertise.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary px-6 py-3">
            Explore Competitions
          </button>
          <button className="btn-outline px-6 py-3">
            Get AI Recommendations
          </button>
        </div>
      </div>
      
      {/* Placeholder sections */}
      <section className="py-16">
        <h2 className="text-center mb-12">Featured Competitions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-48 bg-muted rounded-md mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Competition {i}</h3>
              <p className="text-muted-foreground mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                  International
                </span>
                <button className="btn-ghost px-3 py-1 text-sm">
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
} 