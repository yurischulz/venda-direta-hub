import { SearchableInput } from './searchable-input';

interface Affiliation {
  id: string;
  name: string;
  phone?: string | null;
}

interface AffiliationSearchInputProps {
  affiliations: Affiliation[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (affiliationName: string) => void;
  placeholder?: string;
  className?: string;
}

export function AffiliationSearchInput({
  affiliations,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Filtrar por afiliação",
  className,
}: AffiliationSearchInputProps) {
  const filterAffiliations = (affiliations: Affiliation[], searchTerm: string) => {
    if (!searchTerm) return affiliations;
    
    return affiliations.filter(affiliation =>
      affiliation.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <SearchableInput
      items={affiliations}
      value={value}
      onValueChange={onValueChange}
      onCreateNew={onCreateNew}
      placeholder={placeholder}
      className={className}
      getItemValue={(affiliation) => affiliation.id}
      getItemLabel={(affiliation) => affiliation.name}
      getItemSubLabel={(affiliation) => affiliation.phone}
      filterItems={filterAffiliations}
      createNewLabel="Criar afiliação"
    />
  );
}