export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementType {
  id: string;
  name: string;
  type: 'vegetable' | 'herb' | 'flower' | 'fruit' | 'tree' | 'water' | 'other';
  position: Position;
  size: Size;
  plantedWith?: string;
  plantedDate?: string;
  notes?: string;
}

export interface GardenLayout {
  id: string;
  field_id: string;
  user_id: string;
  elements: ElementType[];
  created_at: string;
  updated_at: string;
}