import { SearchableInput } from './searchable-input';

interface Client {
  id: string;
  name: string;
  affiliations?: {
    id: string;
    name: string;
  } | null;
}

interface ClientSearchInputProps {
  clients: Client[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (clientName: string) => void;
  placeholder?: string;
  className?: string;
}

export function ClientSearchInput({
  clients,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Digite o nome do cliente",
  className,
}: ClientSearchInputProps) {
  const filterClients = (clients: Client[], searchTerm: string) => {
    if (!searchTerm) return clients;
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <SearchableInput
      items={clients}
      value={value}
      onValueChange={onValueChange}
      onCreateNew={onCreateNew}
      placeholder={placeholder}
      className={className}
      getItemValue={(client) => client.id}
      getItemLabel={(client) => client.name}
      getItemSubLabel={(client) => client.affiliations?.name}
      filterItems={filterClients}
      createNewLabel="Criar cliente"
    />
  );
}