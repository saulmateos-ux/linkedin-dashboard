import Link from 'next/link';
import { getCompaniesWithStats } from '@/lib/db';
import SyncCompaniesButton from '@/components/SyncCompaniesButton';
import ScrapeCompaniesButton from '@/components/ScrapeCompaniesButton';

export const revalidate = 3600; // Revalidate every hour

export default async function CompaniesPage() {
  const companies = await getCompaniesWithStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            {companies.length} companies tracked
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <SyncCompaniesButton />
          <ScrapeCompaniesButton
            companies={companies.map(c => ({
              id: c.id,
              display_name: c.display_name,
            }))}
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {company.display_name}
                </h3>
                {company.follower_count && (
                  <p className="text-sm text-gray-600 mt-1">
                    {company.follower_count.toLocaleString()} followers
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {company.employee_count}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Employees</div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {company.post_count}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Posts</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(Number(company.total_engagement) / 1000)}k
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Engagement</div>
                </div>
              </div>

              {company.employee_count > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Avg {Math.round(Number(company.total_engagement) / Math.max(company.post_count, 1))} engagement per post
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No companies found</p>
          <p className="text-gray-400 mt-2">
            Add company profiles to start tracking them
          </p>
        </div>
      )}
    </div>
  );
}
