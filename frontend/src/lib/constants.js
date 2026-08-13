export const STATUS_COLUMNS = [
  { key: 'saved', label: 'Saved', color: '#6B829D' },
  { key: 'applied', label: 'Applied', color: '#5B8DEF' },
  { key: 'online_assessment', label: 'OA', color: '#A78BFA' },
  { key: 'oa_cleared', label: 'OA Cleared', color: '#818CF8' },
  { key: 'interview_r1', label: 'Interview R1', color: '#FBBF24' },
  { key: 'interview_r2', label: 'Interview R2', color: '#F59E0B' },
  { key: 'hr_round', label: 'HR Round', color: '#FB7185' },
  { key: 'offer', label: 'Offer', color: '#2DD4A8' },
  { key: 'rejected', label: 'Rejected', color: '#F87171' },
]

export const WORK_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
]

export const SOURCES = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'internshala', label: 'Internshala' },
  { value: 'naukri', label: 'Naukri' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'career_page', label: 'Career Page' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
]

export const RESUME_CATEGORIES = [
  { value: 'software', label: 'Software Developer' },
  { value: 'data', label: 'Data Analyst' },
  { value: 'fullstack', label: 'Full Stack' },
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'other', label: 'Other' },
]

export function statusLabel(key) {
  return STATUS_COLUMNS.find((s) => s.key === key)?.label || key
}
