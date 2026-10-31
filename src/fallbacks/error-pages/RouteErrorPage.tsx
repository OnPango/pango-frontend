import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { content } from './content';
import { ForbiddenPage } from './ForbiddenPage';
import { NotFoundPage } from './NotFoundPage';
import { StatusPage } from './StatusPage';

/**
 * A lazy page chunk that no longer exists: the app was redeployed while this tab was open.
 * Chrome, Firefox and Safari word it differently.
 */
const STALE_CHUNK = /dynamically imported module|Importing a module script failed/i;

/**
 * `errorElement` for the route table: whatever a route throws (render error, failed lazy import)
 * lands here instead of leaving a blank screen. Placed on the page routes, it renders inside the
 * app layout, so the sidebar stays usable.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return <NotFoundPage />;
    if (error.status === 403) return <ForbiddenPage />;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (STALE_CHUNK.test(message)) {
    return (
      <StatusPage
        {...content.outdated}
        actions={<Button onClick={() => navigate(0)}>{content.actions.reload}</Button>}
      />
    );
  }

  return (
    <StatusPage
      {...content.unexpected}
      actions={
        <>
          <Button variant="outline" onClick={() => navigate(0)}>
            {content.actions.retry}
          </Button>
          <Button onClick={() => navigate('/')}>{content.actions.home}</Button>
        </>
      }
    >
      {/* Never show internals to end users; developers see them while running `pnpm dev`. */}
      {import.meta.env.DEV && (
        <pre className="relative max-w-xl overflow-x-auto rounded-xl border border-line2 bg-surface p-3 text-left text-xs text-danger">
          {message}
        </pre>
      )}
    </StatusPage>
  );
}
