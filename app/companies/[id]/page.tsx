import Link from 'next/link';
import { getProfile, getCompanyPosts } from '@/lib/db';
import SortablePostsTable from '@/components/SortablePostsTable';
import SearchBar from '@/components/SearchBar';

export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    sortBy?: 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    order?: 'asc' | 'desc';
    page?: string;
  }>;
}

export default async function CompanyPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const searchParams_resolved = await searchParams;

  const companyId = parseInt(id);
  const company = await getProfile(companyId);

  if (!company || !company.is_company) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">Company not found</p>
          <Link
            href="/companies"
            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            ← Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const search = searchParams_resolved.search || '';
  const sortBy = searchParams_resolved.sortBy || 'published_at';
  const order = searchParams_resolved.order || 'desc';
  const page = parseInt(searchParams_resolved.page || '1');
  const limit = 25;
  const offset = (page - 1) * limit;

  const { posts, total } = await getCompanyPosts(companyId, {
    search,
    sortBy,
    order,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  // Parse notes JSON to get extra company data
  let companyData: {
    website?: string;
    specialties?: string[];
    employee_count?: number;
    employee_count_range?: string;
    founding_year?: string;
  } = {};

  if (company.notes) {
    try {
      companyData = JSON.parse(company.notes);
    } catch (e) {
      // Ignore parse errors
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/companies"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
        >
          ← Back to Companies
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.display_name}</h1>
            {company.headline && (
              <p className="text-lg text-gray-700 mt-1">{company.headline}</p>
            )}
            {company.follower_count && (
              <p className="text-gray-600 text-sm mt-2">
                🔔 {company.follower_count.toLocaleString()} followers on LinkedIn
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Company Information</h2>

        <div className="space-y-3">
          {company.summary && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">About</h3>
              <p className="text-gray-600 mt-1">{company.summary}</p>
            </div>
          )}

          {company.industry && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Industry</h3>
              <p className="text-gray-600 mt-1">{company.industry}</p>
            </div>
          )}

          {company.location && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">📍 Headquarters</h3>
              <p className="text-gray-600 mt-1">{company.location}</p>
            </div>
          )}

          {companyData.website && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">🌐 Website</h3>
              <a
                href={companyData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 mt-1 inline-block"
              >
                {companyData.website}
              </a>
            </div>
          )}

          {companyData.employee_count_range && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">👥 Company Size</h3>
              <p className="text-gray-600 mt-1">{companyData.employee_count_range}</p>
            </div>
          )}

          {companyData.founding_year && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">📅 Founded</h3>
              <p className="text-gray-600 mt-1">{companyData.founding_year}</p>
            </div>
          )}

          {companyData.specialties && companyData.specialties.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Specialties</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {companyData.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Posts from {company.display_name} Employees
        </h2>
        <p className="text-gray-600 mt-1">
          {total.toLocaleString()} total posts
        </p>
      </div>

      {/* Search */}
      <SearchBar currentSort={sortBy} currentOrder={order} currentSearch={search} />

      {/* Posts Table */}
      {posts.length > 0 ? (
        <>
          <SortablePostsTable posts={posts} showAll title="Employee Posts" />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <a
                href={`/companies/${companyId}?search=${search}&sortBy=${sortBy}&order=${order}&page=${page - 1}`}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
                aria-disabled={page <= 1}
              >
                ← Previous
              </a>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <a
                href={`/companies/${companyId}?search=${search}&sortBy=${sortBy}&order=${order}&page=${page + 1}`}
                className={`px-4 py-2 rounded-lg font-medium ${
                  page >= totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
                aria-disabled={page >= totalPages}
              >
                Next →
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No posts found</p>
          {search && (
            <a href={`/companies/${companyId}`} className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
              Clear search
            </a>
          )}
        </div>
      )}
    </div>
  );
}
