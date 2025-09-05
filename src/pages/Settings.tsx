import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Por enquanto vamos usar localStorage para os templates
      // Em uma implementação futura, isso pode ser movido para o Supabase
      const savedTemplate = localStorage.getItem(`whatsapp-template-${userId}`);
      if (savedTemplate) {
        return [
          {
            id: 'cobranca',
            name: 'Cobrança',
            template: savedTemplate,
            variables: ['{{nome}}', '{{valor}}'],
          },
        ];
      }
      return [
        {
          id: 'cobranca',
          name: 'Cobrança',
          template: 'Olá {{nome}}! Temos um valor pendente de {{valor}} em sua conta. Por favor, entre em contato para regularizar.',
          variables: ['{{nome}}', '{{valor}}'],
        },
      ];
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (newTemplate: string) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      localStorage.setItem(`whatsapp-template-${userId}`, newTemplate);
      return newTemplate;
    },
    onSuccess: () => {
      toast({
        title: 'Template salvo',
        description: 'Template de cobrança foi salvo com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar template.',
        variant: 'destructive',
      });
    },
  });

  const cobrancaTemplate = templates.find((t) => t.id === 'cobranca');

  const handleSave = () => {
    if (template.trim()) {
      saveTemplateMutation.mutate(template);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + variable);
  };

  const loadCurrentTemplate = () => {
    if (cobrancaTemplate) {
      setTemplate(cobrancaTemplate.template);
    }
  };

  return (
    <MobileLayout title="Configurações" showBackButton backTo="/dashboard">
      <div className="p-4 space-y-4">
        {/* Templates de Mensagens WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Templates WhatsApp</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template de Cobrança */}
            <div className="space-y-3">
              <Label htmlFor="cobranca-template">Template de Cobrança</Label>
              
              {/* Variáveis Disponíveis */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Variáveis disponíveis:</div>
                <div className="flex flex-wrap gap-2">
                  {cobrancaTemplate?.variables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => insertVariable(variable)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {variable}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique nas variáveis para adicioná-las ao template
                </p>
              </div>

              {/* Template Atual */}
              {cobrancaTemplate && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Template atual:</div>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {cobrancaTemplate.template}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCurrentTemplate}
                  >
                    Editar template atual
                  </Button>
                </div>
              )}

              {/* Editor */}
              <div className="space-y-2">
                <Label htmlFor="template-editor">
                  {template ? 'Novo template:' : 'Criar/editar template:'}
                </Label>
                <Textarea
                  id="template-editor"
                  placeholder="Digite seu template aqui. Use {{nome}} e {{valor}} como variáveis."
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Preview */}
              {template && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Preview:</div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                    {template
                      .replace(/\{\{nome\}\}/g, 'João Silva')
                      .replace(/\{\{valor\}\}/g, 'R$ 150,00')}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={!template.trim() || saveTemplateMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveTemplateMutation.isPending ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default Settings;