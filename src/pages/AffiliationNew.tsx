import { useSearchParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AffiliationForm } from '@/components/forms/AffiliationForm';

const AffiliationNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const backTo =
    searchParams.get('from') !== null
      ? `/${searchParams.get('from')}`
      : '/affiliations';

  const handleFormSuccess = () => {
    navigate(backTo);
  };

  return (
    <MobileLayout title='Nova Afiliação' showBackButton backTo={backTo}>
      <div className='p-4'>
        <AffiliationForm onSuccess={handleFormSuccess} />
      </div>
    </MobileLayout>
  );
};

export default AffiliationNew;