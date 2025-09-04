import { useSearchParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ClientForm } from '@/components/forms/ClientForm';

const Clients = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const backTo =
    searchParams.get('from') !== null
      ? `/${searchParams.get('from')}`
      : '/dashboard';

  const handleFormSuccess = () => {
    navigate(backTo);
  };

  return (
    <MobileLayout title='Novo Cliente' showBackButton backTo={backTo}>
      <div className='p-4'>
        <ClientForm onSuccess={handleFormSuccess} />
      </div>
    </MobileLayout>
  );
};

export default Clients;
