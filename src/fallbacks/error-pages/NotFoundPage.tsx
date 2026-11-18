import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { content } from './content';
import { NotFoundScene } from './NotFoundScene';
import { StatusPage } from './StatusPage';

/** The URL matches no route: Pango followed a trail that ends at a sign. */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <StatusPage
      {...content.notFound}
      hideEyebrow
      illustration={<NotFoundScene />}
      actions={
        <Button size="lg" className="gap-2" onClick={() => navigate('/')}>
          <FiArrowLeft aria-hidden="true" /> {content.actions.home}
        </Button>
      }
    />
  );
}
