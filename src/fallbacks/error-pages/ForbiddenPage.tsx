import { FiArrowLeft, FiHome } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { content } from './content';
import { ForbiddenScene } from './ForbiddenScene';
import { StatusPage } from './StatusPage';

/**
 * The user is signed in but lacks the permission the route requires (HTTP 403): Pango knocks into
 * the padlocked gate of a garden. A missing or expired session is a different case (401): the
 * guards send those users to /login.
 */
export function ForbiddenPage() {
  const navigate = useNavigate();
  // The first entry of the session has the key "default": there is nothing to go back to.
  const canGoBack = useLocation().key !== 'default';

  return (
    <StatusPage
      {...content.forbidden}
      hideEyebrow
      illustration={<ForbiddenScene />}
      actions={
        <>
          {canGoBack && (
            <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate(-1)}>
              <FiArrowLeft aria-hidden="true" /> {content.actions.back}
            </Button>
          )}
          <Button size="lg" className="gap-2" onClick={() => navigate('/')}>
            <FiHome aria-hidden="true" /> {content.actions.home}
          </Button>
        </>
      }
    />
  );
}
