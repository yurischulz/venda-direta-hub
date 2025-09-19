import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent } from "@/components/ui/mobile-tabs";
import { ClientForm } from "@/components/forms/ClientForm";
import { AffiliationForm } from "@/components/forms/AffiliationForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CustomerAccountsRegister = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("client");

  const handleFormSuccess = () => {
    // Redirect back to customer accounts list after successful registration
    navigate("/customer-accounts");
  };

  return (
    <MobileLayout
      title="Cadastros"
      showBackButton
      backTo="/customer-accounts"
    >
      <div className="flex-1 flex flex-col">
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value="client">
              Cadastrar Cliente
            </MobileTabsTrigger>
            <MobileTabsTrigger value="affiliation">
              Cadastrar Afiliação
            </MobileTabsTrigger>
          </MobileTabsList>
          
          <MobileTabsContent value="client">
            <div className="p-4 space-y-4">
              <ClientForm onSuccess={handleFormSuccess} />
            </div>
          </MobileTabsContent>
          
          <MobileTabsContent value="affiliation">
            <div className="p-4 space-y-4">
              <AffiliationForm onSuccess={handleFormSuccess} />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default CustomerAccountsRegister;