import { Profile, ProfileExperience, ProfileEducation } from '@/lib/db';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Globe } from 'lucide-react';

interface ProfileBackgroundProps {
  profile: Profile;
  experiences: ProfileExperience[];
  education: ProfileEducation[];
}

export default function ProfileBackground({
  profile,
  experiences,
  education,
}: ProfileBackgroundProps) {
  const hasBackgroundData =
    profile.email ||
    profile.phone ||
    profile.location ||
    profile.summary ||
    (profile.skills && profile.skills.length > 0) ||
    experiences.length > 0 ||
    education.length > 0;

  if (!hasBackgroundData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-gray-500 text-center">
          No background data available. Click &quot;Scrape Backgrounds&quot; to fetch LinkedIn profile data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      {(profile.summary || profile.email || profile.phone || profile.location) && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>

          {profile.summary && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">About</h3>
              <p className="text-gray-600 whitespace-pre-line">{profile.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.email && (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-blue-600" />
                <a href={`mailto:${profile.email}`} className="hover:underline">
                  {profile.email}
                </a>
              </div>
            )}

            {profile.phone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-blue-600" />
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}

            {profile.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Work Experience Section */}
      {experiences.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Work Experience</h2>
          </div>

          <div className="space-y-6">
            {experiences.map((exp) => (
              <div key={exp.id} className="border-l-2 border-blue-200 pl-4 relative">
                {exp.is_current && (
                  <span className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></span>
                )}

                <div className="mb-2">
                  <h3 className="font-semibold text-lg">{exp.title}</h3>
                  {exp.company_url ? (
                    <a
                      href={exp.company_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {exp.company_name}
                    </a>
                  ) : (
                    <p className="text-gray-700">{exp.company_name}</p>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <span>
                    {exp.start_date || 'Start date unknown'} -{' '}
                    {exp.is_current ? (
                      <span className="font-semibold text-blue-600">Present</span>
                    ) : (
                      exp.end_date || 'End date unknown'
                    )}
                  </span>
                  {exp.duration_months && (
                    <span className="ml-2">
                      ({formatDuration(exp.duration_months)})
                    </span>
                  )}
                </div>

                {exp.employment_type && (
                  <p className="text-sm text-gray-600 mb-1">{exp.employment_type}</p>
                )}

                {exp.location && (
                  <p className="text-sm text-gray-600 mb-2">{exp.location}</p>
                )}

                {exp.description && (
                  <p className="text-gray-700 text-sm whitespace-pre-line mt-2">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {education.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Education</h2>
          </div>

          <div className="space-y-6">
            {education.map((edu) => (
              <div key={edu.id} className="border-l-2 border-green-200 pl-4">
                <div className="mb-2">
                  {edu.school_url ? (
                    <a
                      href={edu.school_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-lg text-blue-600 hover:underline"
                    >
                      {edu.school_name}
                    </a>
                  ) : (
                    <h3 className="font-semibold text-lg">{edu.school_name}</h3>
                  )}

                  {edu.degree && (
                    <p className="text-gray-700">
                      {edu.degree}
                      {edu.field_of_study && `, ${edu.field_of_study}`}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  {edu.start_year && edu.end_year ? (
                    <span>
                      {edu.start_year} - {edu.end_year}
                    </span>
                  ) : edu.start_year ? (
                    <span>{edu.start_year}</span>
                  ) : null}
                </div>

                {edu.grade && (
                  <p className="text-sm text-gray-700 mb-1">Grade: {edu.grade}</p>
                )}

                {edu.activities && (
                  <p className="text-sm text-gray-700 mb-1">
                    Activities: {edu.activities}
                  </p>
                )}

                {edu.description && (
                  <p className="text-gray-700 text-sm mt-2">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills, Languages, Certifications Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Skills</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill.name}
                  {skill.endorsements && (
                    <span className="ml-1 text-blue-600">({skill.endorsements})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Languages</h2>
            </div>

            <div className="space-y-2">
              {profile.languages.map((lang, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-medium">{lang.name}</span>
                  {lang.proficiency && (
                    <span className="text-sm text-gray-600">{lang.proficiency}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certifications */}
      {profile.certifications && profile.certifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Certifications</h2>
          </div>

          <div className="space-y-3">
            {profile.certifications.map((cert, idx) => (
              <div key={idx} className="border-l-2 border-purple-200 pl-4">
                <h3 className="font-semibold">{cert.name}</h3>
                {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                {cert.issued_date && (
                  <p className="text-sm text-gray-500">Issued {cert.issued_date}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honors & Awards */}
      {profile.honors_awards && profile.honors_awards.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Honors & Awards</h2>
          </div>

          <div className="space-y-3">
            {profile.honors_awards.map((award, idx) => (
              <div key={idx} className="border-l-2 border-yellow-200 pl-4">
                <h3 className="font-semibold">{award.title}</h3>
                {award.issuer && <p className="text-sm text-gray-600">{award.issuer}</p>}
                {award.date && (
                  <p className="text-sm text-gray-500">{award.date}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {profile.profile_scraped_at && (
        <div className="text-center text-sm text-gray-500">
          Profile data last updated:{' '}
          {new Date(profile.profile_scraped_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Format duration in months to human-readable string
 * Examples: 12 months -> "1 year", 18 months -> "1 year 6 months"
 */
function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
}
