import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
      {/* Show devtools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <TanStackRouterDevtools position="bottom-left" />
      )}
    </>
  )
} 