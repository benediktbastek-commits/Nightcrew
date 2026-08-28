import Link from 'next/link';
import { Chip } from '@/components/ui';
import { formatPostTime } from '@/lib/format';
import { POST_STATUS_LABEL, POST_STATUS_TONE } from '@/lib/post-status';
import type { Post } from '@/lib/types';

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/content/${post.id}/edit`} className="post">
      <div className="thumbnail" />
      <div className="grow">
        <div className="post-meta">
          {post.platform.toUpperCase()} <span>{post.planned_at ? formatPostTime(post.planned_at) : 'OHNE TERMIN'}</span>
        </div>
        <p>{post.caption || '—'}</p>
      </div>
      <Chip tone={POST_STATUS_TONE[post.status]}>{POST_STATUS_LABEL[post.status]}</Chip>
    </Link>
  );
}
