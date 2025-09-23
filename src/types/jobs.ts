export interface Job {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  company_name: string;
  description: string;
  location: string;
  job_type: string;
  salary_range: string;
  requirements: string[];
  contact_email: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    avatar_url?: string;
    full_name?: string;
  };
}