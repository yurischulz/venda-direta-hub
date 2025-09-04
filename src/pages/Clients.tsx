import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent } from "@/components/ui/mobile-tabs";
import { ClientForm } from "@/components/forms/ClientForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  email: string;
  address: string;
  affiliation_id: string;
  affiliations?: {
    name: string;
  };
}

const Clients = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const backTo = searchParams.get('from') === 'customer-accounts' ? '/customer-accounts' : '/dashboard';

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          affiliations (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({
        title: "Cliente removido!",
        description: "O cliente foi removido com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o cliente.",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (clientId: string) => {
    setEditingClient(clientId);
    setActiveTab("add");
  };

  const handleFormSuccess = () => {
    setEditingClient(null);
    setActiveTab("list");
  };

  const handleDelete = (clientId: string) => {
    if (confirm("Tem certeza que deseja remover este cliente?")) {
      deleteMutation.mutate(clientId);
    }
  };

  return (
    <MobileLayout 
      title="Clientes" 
      showBackButton 
      backTo={backTo}
      actions={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setEditingClient(null);
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
              Lista ({clients.length})
            </MobileTabsTrigger>
            <MobileTabsTrigger value="add">
              {editingClient ? "Editar" : "Adicionar"}
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
              ) : clients.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Nenhum cliente cadastrado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comece adicionando seu primeiro cliente
                    </p>
                    <Button onClick={() => setActiveTab("add")} className="mobile-tap">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Cliente
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                clients.map((client) => (
                  <Card key={client.id} className="card-hover">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{client.name}</span>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client.id)}
                            className="mobile-tap"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            className="mobile-tap text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {client.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2" />
                          {client.email}
                        </div>
                      )}
                      {client.affiliations && (
                        <div className="text-sm">
                          <span className="text-primary font-medium">
                            {client.affiliations.name}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </MobileTabsContent>

          <MobileTabsContent value="add">
            <div className="mt-4">
              <ClientForm 
                clientId={editingClient || undefined} 
                onSuccess={handleFormSuccess} 
              />
            </div>
          </MobileTabsContent>
        </MobileTabs>
      </div>
    </MobileLayout>
  );
};

export default Clients;