import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { content } from './content';
import { StatusPage } from './StatusPage';

/**
 * The user is signed in but lacks the permission the route requires (HTTP 403). A missing or
 * expired session is a different case (401): the guards send those users to /login.
 */
export function ForbiddenPage() {
  const navigate = useNavigate();
  // The first entry of the session has the key "default": there is nothing to go back to.
  const canGoBack = useLocation().key !== 'default';

  return (
    <StatusPage
      {...content.forbidden}
      actions={
        <>
          {canGoBack && (
            <Button variant="outline" onClick={() => navigate(-1)}>
              {content.actions.back}
            </Button>
          )}
          <Button onClick={() => navigate('/')}>{content.actions.home}</Button>
        </>
      }
    />
  );
}
