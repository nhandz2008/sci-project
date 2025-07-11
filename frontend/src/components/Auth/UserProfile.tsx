import { useState } from 'react'
import { User, LogOut, Settings, Shield, Crown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatDate, enumToDisplayText } from '@/utils'

interface UserProfileProps {
  className?: string
  showFullProfile?: boolean
}

export const UserProfile = ({ className, showFullProfile = false }: UserProfileProps) => {
  const { user, logout, isLoading } = useAuth()
  const [isLogoutLoading, setIsLogoutLoading] = useState(false)

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLogoutLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'creator':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'creator':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!showFullProfile) {
    // Compact profile for header/navbar
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          disabled={isLoading || isLogoutLoading}
          className={cn(
            'p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Full profile view
  return (
    <div className={cn('bg-card rounded-lg border p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {getRoleIcon(user.role)}
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-md border',
                  getRoleBadgeColor(user.role)
                )}
              >
                {enumToDisplayText(user.role)}
              </span>
            </div>
          </div>
        </div>
        
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* User Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <p className="text-sm">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                  user.is_active
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    user.is_active ? 'bg-green-500' : 'bg-red-500'
                  )}
                />
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Member Since</label>
            <p className="text-sm">{formatDate(user.created_at)}</p>
          </div>
        </div>

        {user.updated_at && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
            <p className="text-sm">{formatDate(user.updated_at)}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t">
        <button
          onClick={handleLogout}
          disabled={isLoading || isLogoutLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md font-medium',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <LogOut className="h-4 w-4" />
          {isLogoutLoading ? 'Signing Out...' : 'Sign Out'}
        </button>
        
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md font-medium',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            'transition-colors duration-200'
          )}
        >
          <Settings className="h-4 w-4" />
          Account Settings
        </button>
      </div>
    </div>
  )
} 