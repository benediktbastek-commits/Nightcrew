import { ReleaseForm } from '../release-form';
import { createRelease } from '../actions';

export default function NewReleasePage() {
  return <ReleaseForm mode="create" action={createRelease} />;
}
