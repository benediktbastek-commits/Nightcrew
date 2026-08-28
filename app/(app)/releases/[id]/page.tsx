import { Screen } from '@/components/screen';
import { ReleaseView } from '../release-view';

export default function ReleaseDetailPage({ params }: { params: { id: string } }) {
  return (
    <Screen title="RELEASES">
      <ReleaseView releaseId={params.id} />
    </Screen>
  );
}
