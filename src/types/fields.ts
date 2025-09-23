export interface Field {
  id: string;
  name: string;
  description?: string;
  country: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: {
    username: string;
    avatar_url?: string;
  };
  _count?: {
    members: number;
  };
}

export interface FieldTask {
  id: string;
  field_id: string;
  user_id: string;
  title: string;
  details?: string;
  date: string;
  task_type: 'planting' | 'watering' | 'harvesting' | 'fertilising' | 'weeding' | 'other';
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export interface FieldMember {
  id: string;
  field_id: string;
  user_id: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export interface FieldInvitation {
  id: string;
  field_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  inviter?: {
    username: string;
    avatar_url?: string;
  };
  invitee?: {
    username: string;
    avatar_url?: string;
  };
}