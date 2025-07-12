import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { UserProfile } from '@/components/Auth/UserProfile'
import { 
  LogIn, 
  UserPlus, 
  Search, 
  Menu, 
  X, 
  Trophy,
  Home,
  Calendar,
  Users,
  Settings
} from 'lucide-react'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Competitions', href: '/competitions', icon: Calendar },
    ...(isAuthenticated ? [
      { name: 'Dashboard', href: '/dashboard', icon: Settings }
    ] : [])
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto container-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
              onClick={closeMobileMenu}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">SCI</span>
            </Link>
            <span className="hidden md:block text-sm text-gray-500 ml-2">
              Science Competitions Insight
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href as any}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary transition-colors font-medium"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate({ to: '/competitions/create' })}
                  className="btn-outline px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Create Competition
                </button>
                <UserProfile />
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate({ to: '/auth/login' })}
                  className="text-gray-600 hover:text-primary transition-colors font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate({ to: '/auth/register' })}
                  className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-primary transition-colors p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href as any}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
              
              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate({ to: '/competitions/create' })
                        closeMobileMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Create Competition</span>
                    </button>
                    <div className="px-3 py-2">
                      <UserProfile />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate({ to: '/auth/login' })
                        closeMobileMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      <span className="font-medium">Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate({ to: '/auth/register' })
                        closeMobileMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="font-medium">Sign Up</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 