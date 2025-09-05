import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientPhone: string;
}

export const ChargeModal = ({ isOpen, onClose, clientName, clientPhone }: ChargeModalProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (amount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, insira um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    if (!clientPhone) {
      toast({
        title: 'Telefone não encontrado',
        description: 'Este cliente não possui telefone cadastrado.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Buscar template do localStorage
      const userId = (await import('@/integrations/supabase/client')).supabase.auth.getUser().then(r => r.data.user?.id);
      const template = localStorage.getItem(`whatsapp-template-${await userId}`) || 
        'Olá {{nome}}! Temos um valor pendente de {{valor}} em sua conta. Por favor, entre em contato para regularizar.';

      // Formatar valores
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      // Substituir variáveis no template
      const message = template
        .replace(/\{\{nome\}\}/g, clientName)
        .replace(/\{\{valor\}\}/g, formattedAmount);

      // Limpar telefone (remover caracteres não numéricos)
      const cleanPhone = clientPhone.replace(/\D/g, '');
      
      // Construir URL do WhatsApp
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');

      toast({
        title: 'WhatsApp aberto',
        description: `Mensagem de cobrança preparada para ${clientName}.`,
      });

      // Fechar modal e resetar
      onClose();
      setAmount(0);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao preparar mensagem de cobrança.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setAmount(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Cobrar via WhatsApp</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cliente</Label>
            <div className="p-3 bg-muted rounded-md text-sm font-medium">
              {clientName}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Telefone</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {clientPhone || 'Não informado'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Valor a cobrar *
            </Label>
            <MoneyInput
              id="amount"
              value={amount}
              onValueChange={setAmount}
              placeholder="R$ 0,00"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1"
              disabled={amount <= 0 || !clientPhone || isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};