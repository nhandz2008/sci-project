import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { competitionAPI } from '@/client/api'
import { CompetitionGrid, CompetitionFilters } from '@/components/Competition'
import { CompetitionFilters as CompetitionFiltersType } from '@/types'

const CompetitionsPage = () => {
  const [filters, setFilters] = useState<CompetitionFiltersType>({})
  const [page, setPage] = useState(1)
  const pageSize = 12

  const {
    data: competitionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['competitions', filters, page, pageSize],
    queryFn: () =>
      competitionAPI.getCompetitions({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        ...filters,
      }),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleFiltersChange = (newFilters: CompetitionFiltersType) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const totalPages = competitionsData ? competitionsData.pages : 0
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Science Competitions
          </h1>
          <p className="text-gray-600">
            Discover and participate in science and technology competitions worldwide
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <CompetitionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            loading={isLoading}
          />
        </div>

        {/* Competition Grid */}
        <CompetitionGrid
          competitions={competitionsData?.competitions || []}
          loading={isLoading}
          error={error?.message}
          emptyMessage="No competitions match your filters. Try adjusting your search criteria."
          className="mb-8"
        />

        {/* Pagination */}
        {competitionsData && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!hasPreviousPage}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasNextPage}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(page - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(page * pageSize, competitionsData.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{competitionsData.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!hasPreviousPage}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pageNum === page
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNextPage}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600 mb-4">
            Can't find what you're looking for?
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setFilters({})}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              Refresh Results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/competitions/')({
  component: CompetitionsPage,
  meta: () => [
    {
      title: 'Science Competitions | SCI Platform',
    },
    {
      name: 'description',
      content: 'Browse and discover science and technology competitions worldwide. Filter by location, scale, subject areas, and more.',
    },
  ],
}) 