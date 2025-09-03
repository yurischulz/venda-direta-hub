import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent } from "@/components/ui/mobile-tabs";
import { AffiliationForm } from "@/components/forms/AffiliationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, TrendingUp, Phone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Affiliation {
  id: string;
  name: string;
  phone: string;
  _count?: {
    clients: number;
  };
}

const Affiliations = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [editingAffiliation, setEditingAffiliation] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: affiliations = [], isLoading } = useQuery({
    queryKey: ['affiliations'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('affiliations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get client counts for each affiliation
      const affiliationsWithCounts = await Promise.all(
        data.map(async (affiliation) => {
          const { count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('affiliation_id', affiliation.id);
          
          return {
            ...affiliation,
            _count: { clients: count || 0 }
          };
        })
      );
      
      return affiliationsWithCounts as Affiliation[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (affiliationId: string) => {
      const { error } = await supabase
        .from('affiliations')
        .delete()
        .eq('id', affiliationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Afiliação removida!",
        description: "A afiliação foi removida com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a afiliação.",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (affiliationId: string) => {
    setEditingAffiliation(affiliationId);
    setActiveTab("add");
  };

  const handleFormSuccess = () => {
    setEditingAffiliation(null);
    setActiveTab("list");
  };

  const handleDelete = (affiliationId: string) => {
    if (confirm("Tem certeza que deseja remover esta afiliação? Os clientes vinculados ficarão sem afiliação.")) {
      deleteMutation.mutate(affiliationId);
    }
  };

  return (
    <MobileLayout 
      title="Afiliações" 
      showBackButton 
      backTo="/dashboard"
      actions={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setEditingAffiliation(null);
            setActiveTab("add");
          }}
          className="mobile-tap"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <div className="p-4">
        <MobileTabs value={activeTab} onValueChange={setActiveTab}>
          <MobileTabsList>
            <MobileTabsTrigger value="list">
              Lista ({affiliations.length})
            </MobileTabsTrigger>
            <MobileTabsTrigger value="add">
              {editingAffiliation ? "Editar" : "Adicionar"}
            </MobileTabsTrigger>
          </MobileTabsList>

          <MobileTabsContent value="list">
            <div className="space-y-4 mt-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                  </Card>
                ))
              ) : affiliations.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Nenhuma afiliação cadastrada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Afiliações ajudam a organizar seus clientes
                    </p>
                    <Button onClick={() => setActiveTab("add")} className="mobile-tap">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Afiliação
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                affiliations.map((affiliation) => (
                  <Card key={affiliation.id} className="card-hover">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{affiliation.name}</span>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(affiliation.id)}
                            className="mobile-tap"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(affiliation.id)}
                            className="mobile-tap text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {affiliation.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {affiliation.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-primary">
                        <Users className="h-4 w-4 mr-2" />
                        {affiliation._count?.clients || 0} cliente(s)
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </MobileTabsContent>

          <MobileTabsContent value="add">
            <div className="mt-4">
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