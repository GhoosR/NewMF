export interface PractitionerPackage {
  id: string;
  practitioner_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface Practitioner {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  work_arrangement: string;
  corporate_wellness: boolean;
  country: string;
  address: string;
  language: string;
  starting_price: number | null;
  currency: string;
  faqs: string;
  images: string[];
  certification_url: string | null;
  created_at: string;
  updated_at: string;
  packages?: PractitionerPackage[];
}

export interface PractitionerFormData {
  category: string;
  title: string;
  description: string;
  work_arrangement: string;
  corporate_wellness: boolean;
  country: string;
  address: string;
  languages: string[];
  currency: string;
  faqs: string;
  packages: {
    name: string;
    description: string;
    price: number;
    features: string[];
  }[];
}