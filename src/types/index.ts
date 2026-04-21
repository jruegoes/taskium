export interface Project {
  id: string;
  name: string;
  share_id: string;
  owner_id: string | null;
  password_hash: string | null;
  created_at: string;
}

export interface Column {
  id: string;
  project_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  image_url: string | null;
  images: string[];
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}
