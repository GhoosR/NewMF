export interface CropInfo {
  name: string;
  description: string;
  sowingTime: {
    indoor?: string;
    outdoor?: string;
  };
  harvestTime: string;
  spacing: string;
  soil: string;
  sunlight: string;
  watering: string;
  companions?: string[];
  pests?: string[];
  diseases?: string[];
  tips: string[];
}

export interface PlantedCrop {
  id: string;
  field_id: string;
  crop_name: string;
  planted_date: string;
  expected_harvest_date: string;
  notes?: string;
  location?: string;
}