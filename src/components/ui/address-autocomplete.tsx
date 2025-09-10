import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value?: string;
  onAddressSelect?: (address: string, latitude: number, longitude: number) => void;
  className?: string;
  placeholder?: string;
  label?: string;
}

export const AddressAutocomplete = ({
  value = '',
  onAddressSelect,
  className,
  placeholder = 'Digite o endereço...',
  label = 'Endereço'
}: AddressAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Usando Nominatim (OpenStreetMap) como alternativa gratuita
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}&countrycodes=br`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const address = suggestion.display_name;
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    setInputValue(address);
    setSuggestions([]);
    setShowSuggestions(false);
    onAddressSelect?.(address, lat, lng);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="address">{label}</Label>
      <div className="relative">
        <Input
          id="address"
          value={inputValue}
          onChange={handleInputChange}
          className={cn('mobile-input pr-10', className)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="text-sm font-medium">{suggestion.display_name}</div>
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg p-3">
          <div className="text-sm text-muted-foreground">Buscando endereços...</div>
        </div>
      )}
    </div>
  );
};