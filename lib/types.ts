export type GigStatus = 'confirmed' | 'requested' | 'option' | 'cancelled';

export type Gig = {
  id: string;
  venue: string;
  city: string;
  date: string;
  set_start: string | null;
  set_end: string | null;
  fee_cents: number;
  currency: string;
  status: GigStatus;
  contact_id: string | null;
  tech_notes: string | null;
  hotel: string | null;
  travel: string | null;
  advance_confirmed: boolean;
  rider_sent: boolean;
};

export type ContactRole = 'booking' | 'label_promo' | 'crew';

export type Contact = {
  id: string;
  name: string;
  organisation: string | null;
  role: ContactRole;
  email: string | null;
  phone: string | null;
  last_contact_at: string | null;
  notes: string | null;
};

export type TaskScope = 'general' | 'gig' | 'release';

export type Task = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  scope: TaskScope;
  gig_id: string | null;
  release_id: string | null;
  phase_id: string | null;
  sort_order: number;
};

export type PostPlatform = 'instagram' | 'tiktok' | 'youtube' | 'spotify';
export type PostFormat = 'reel' | 'carousel' | 'story' | 'video';
export type PostStatus = 'idea' | 'draft' | 'in_progress' | 'ready' | 'published';

export type Post = {
  id: string;
  platform: PostPlatform;
  format: PostFormat;
  caption: string | null;
  planned_at: string | null;
  published_at: string | null;
  status: PostStatus;
  release_id: string | null;
  gig_id: string | null;
  media_url: string | null;
  external_url: string | null;
  external_id: string | null;
  ai_generated: boolean;
  source_plan_id: string | null;
};

export type ReleaseKind = 'ep' | 'single' | 'album' | 'remix';
export type ReleaseStatus = 'planning' | 'scheduled' | 'released';

export type Release = {
  id: string;
  title: string;
  kind: ReleaseKind;
  label: string | null;
  release_date: string;
  campaign_start: string;
  status: ReleaseStatus;
  budget_cents: number;
  presave_count: number;
  presave_goal: number;
  artwork_url: string | null;
};

export type ReleasePhase = {
  id: string;
  release_id: string;
  no: number;
  name: string;
  starts_on: string;
  ends_on: string;
  sort_order: number;
};

export type TrackStatus = 'master' | 'revision' | 'open';

export type Track = {
  id: string;
  release_id: string;
  side_label: string;
  title: string;
  duration_seconds: number | null;
  status: TrackStatus;
  sort_order: number;
};

export type ReleaseAsset = {
  id: string;
  release_id: string;
  name: string;
  done: boolean;
  done_on: string | null;
};

export type ReleaseDeadline = {
  id: string;
  release_id: string;
  title: string;
  due_date: string;
  owner_contact_id: string | null;
  done: boolean;
};

export type ImportKind = 'account' | 'post';

export type Import = {
  id: string;
  platform: PostPlatform;
  kind: ImportKind;
  image_path: string;
  raw_extraction: Record<string, unknown> | null;
  confidence: Record<string, number> | null;
  confirmed_at: string | null;
  created_at: string;
};

export type AccountMetric = {
  id: string;
  platform: PostPlatform;
  period_start: string;
  period_end: string;
  views: number | null;
  reach: number | null;
  profile_views: number | null;
  followers_delta: number | null;
  interactions: number | null;
  likes: number | null;
  comments: number | null;
  reposts: number | null;
  shares: number | null;
  saves: number | null;
  source: 'screenshot' | 'manual' | 'api';
  import_id: string | null;
  previous: Record<string, number | null> | null;
};

export type PostMetric = {
  id: string;
  post_id: string;
  measured_at: string;
  views: number | null;
  likes: number | null;
  saves: number | null;
  shares: number | null;
  followers_delta: number | null;
  avg_watch_seconds: number | null;
  completion_rate: number | null;
  retention_curve: number[] | null;
  source: 'screenshot' | 'manual' | 'api';
  import_id: string | null;
};

export type AccountExtraction = {
  platform: PostPlatform;
  period_start?: string;
  period_end?: string;
  views?: number;
  reach?: number;
  profile_views?: number;
  followers_delta?: number;
  interactions?: number;
  likes?: number;
  comments?: number;
  reposts?: number;
  shares?: number;
  saves?: number;
  confidence: Record<string, number>;
  unreadable_fields?: string[];
};

export type PostExtraction = {
  platform: PostPlatform;
  posted_date?: string;
  views?: number;
  likes?: number;
  saves?: number;
  shares?: number;
  followers_delta?: number;
  avg_watch_seconds?: number;
  completion_rate?: number;
  analysis: string;
  confidence: Record<string, number>;
  unreadable_fields?: string[];
};

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'overdue';

export type Invoice = {
  id: string;
  number: string;
  gig_id: string | null;
  recipient: string;
  amount_cents: number;
  issued_on: string;
  due_on: string | null;
  paid_on: string | null;
  status: InvoiceStatus;
};

export type Expense = {
  id: string;
  category: string;
  amount_cents: number;
  date: string;
  note: string | null;
  gig_id: string | null;
};

export type ItineraryStop = {
  id: string;
  gig_id: string;
  time: string;
  title: string;
  detail: string | null;
  done: boolean;
  sort_order: number;
};

export type Role = 'dj_producer' | 'photographer_videographer' | 'manager';

export type PortfolioItem = {
  title: string;
  url: string;
};

export type ProfileSocials = {
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  spotify: string | null;
  soundcloud: string | null;
  website: string | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string | null;
  roles: Role[];
  ai_unlocked: boolean;
  skills: string[];
  portfolio: PortfolioItem[];
  onboarded_at: string | null;
  wants_content: boolean;
  wants_bookings: boolean;
  wants_releases: boolean;
  wants_analytics: boolean;
  wants_finance: boolean;
  wants_tour: boolean;
  wants_marketplace: boolean;
  wants_network: boolean;
  wants_crew_ai: boolean;
  bio: string | null;
  city: string | null;
  socials: ProfileSocials | null;
  username: string | null;
};

export type ServiceType = 'photo' | 'video' | 'both';
export type RequestStatus = 'open' | 'matched' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'declined';

export type ServiceRequest = {
  id: string;
  dj_user_id: string;
  gig_id: string | null;
  location: string;
  date: string;
  service_type: ServiceType;
  notes: string | null;
  status: RequestStatus;
  matched_photographer_id: string | null;
  matched_gig_id: string | null;
  target_photographer_id: string | null;
  created_at: string;
};

export type PhotographerAvailability = {
  id: string;
  photographer_user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  created_at: string;
};

export type ServiceOffer = {
  id: string;
  request_id: string;
  photographer_user_id: string;
  message: string | null;
  status: OfferStatus;
  created_at: string;
};

export type Review = {
  id: string;
  request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
};

export type ConnectionMessage = {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type Notification = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
};

export type DirectMessage = {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type PlanItem = {
  id: string;
  planned_for: string;
  platform: PostPlatform;
  idea: string;
  accepted: boolean;
  post_id: string | null;
};
