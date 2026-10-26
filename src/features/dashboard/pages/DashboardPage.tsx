import { useAuthStore } from '@/core/auth/auth.store';
import { buildGreeting, DashboardContent } from '../content/content';
import { PageHeader } from '@/shared/ui/PageHeader';

export default function DashboardPage() {
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <>
      <div className="flex flex-col gap-10">
        <PageHeader title={buildGreeting(userName)} subtitle={DashboardContent.message} />
      </div>
    </>
  );
}
