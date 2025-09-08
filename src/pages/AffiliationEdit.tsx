import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AffiliationForm } from '@/components/forms/AffiliationForm';

const AffiliationEdit = () => {
  const { affiliationId } = useParams<{ affiliationId: string }>();
  const navigate = useNavigate();

  const handleFormSuccess = () => {
    navigate('/affiliations');
  };

  if (!affiliationId) {
    navigate('/affiliations');
    return null;
  }

  return (
    <MobileLayout title='Editar Afiliação' showBackButton backTo='/affiliations'>
      <div className='p-4'>
        <AffiliationForm
          affiliationId={affiliationId}
          onSuccess={handleFormSuccess}
        />
      </div>
    </MobileLayout>
  );
};

export default AffiliationEdit;