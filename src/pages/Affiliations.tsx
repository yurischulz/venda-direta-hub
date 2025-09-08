import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AffiliationsList } from '@/components/AffiliationsList';
import { AffiliationForm } from '@/components/forms/AffiliationForm';
import { 
  MobileTabs, 
  MobileTabsList, 
  MobileTabsTrigger, 
  MobileTabsContent 
} from '@/components/ui/mobile-tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Affiliations = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [editingAffiliation, setEditingAffiliation] = useState<string | null>(null);

  const handleFormSuccess = () => {
    setActiveTab('list');
    setEditingAffiliation(null);
  };

  const handleEdit = (affiliationId: string) => {
    setEditingAffiliation(affiliationId);
    setActiveTab('form');
  };

  const handleNewAffiliation = () => {
    setEditingAffiliation(null);
    setActiveTab('form');
  };

  return (
    <MobileLayout 
      title='Afiliações' 
      showBackButton 
      backTo='/dashboard'
      actions={
        <Button
          variant='ghost'
          size='sm'
          onClick={handleNewAffiliation}
          className='mobile-tap'
        >
          <Plus className='h-4 w-4' />
        </Button>
      }
    >
      <div className='p-4'>
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value='list'>Listagem</MobileTabsTrigger>
            <MobileTabsTrigger value='form'>
              {editingAffiliation ? 'Editar' : 'Nova'} Afiliação
            </MobileTabsTrigger>
          </MobileTabsList>

          <MobileTabsContent value='list'>
            <div className='mt-4'>
              <AffiliationsList
                onEdit={handleEdit}
                onNew={handleNewAffiliation}
              />
            </div>
          </MobileTabsContent>

          <MobileTabsContent value='form'>
            <div className='mt-4'>
              <AffiliationForm
                affiliationId={editingAffiliation || undefined}
                onSuccess={handleFormSuccess}
              />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default Affiliations;