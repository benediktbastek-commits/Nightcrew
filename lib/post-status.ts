import type { PostStatus } from '@/lib/types';

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  idea: 'IDEE',
  draft: 'ENTWURF',
  in_progress: 'IN ARBEIT',
  ready: 'FERTIG',
  published: 'VERÖFFENTLICHT',
};

export const POST_STATUS_TONE: Record<PostStatus, 'solid' | 'outline' | 'dim'> = {
  idea: 'dim',
  draft: 'outline',
  in_progress: 'outline',
  ready: 'solid',
  published: 'dim',
};
