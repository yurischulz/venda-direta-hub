import { SearchableInput } from './searchable-input';

interface Product {
  id: string;
  name: string;
  price: number;
  unit?: string | null;
}

interface ProductSearchInputProps {
  products: Product[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (productName: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSearchInput({
  products,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Digite o nome do produto",
  className,
}: ProductSearchInputProps) {
  const filterProducts = (products: Product[], searchTerm: string) => {
    if (!searchTerm) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <SearchableInput
      items={products}
      value={value}
      onValueChange={onValueChange}
      onCreateNew={onCreateNew}
      placeholder={placeholder}
      className={className}
      getItemValue={(product) => product.id}
      getItemLabel={(product) => product.name}
      getItemSubLabel={(product) => 
        `${formatCurrency(Number(product.price))}${product.unit ? ` por ${product.unit}` : ''}`
      }
      filterItems={filterProducts}
      createNewLabel="Criar produto"
    />
  );
}