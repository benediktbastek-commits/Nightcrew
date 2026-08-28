import { Screen } from '@/components/screen';
import { ReleaseForm } from '../release-form';
import { createRelease } from '../actions';

export default function NewReleasePage() {
  return (
    <Screen title="NEUES RELEASE" back="/releases">
      <ReleaseForm mode="create" action={createRelease} />
    </Screen>
  );
}
