import { useAuthStore } from '@/core/auth/auth.store';
import { buildGreeting, DashboardContent } from '../content/content';

export default function DashboardPage() {
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold lg:text-4xl">{buildGreeting(userName)}</h2>
          <p className="font-light">{DashboardContent.message}</p>
        </section>
      </div>
    </>
  );
}
