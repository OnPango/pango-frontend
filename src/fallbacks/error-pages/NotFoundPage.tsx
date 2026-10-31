import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { content } from './content';
import { StatusPage } from './StatusPage';

/** The URL matches no route. */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <StatusPage
      {...content.notFound}
      actions={<Button onClick={() => navigate('/')}>{content.actions.home}</Button>}
    />
  );
}
