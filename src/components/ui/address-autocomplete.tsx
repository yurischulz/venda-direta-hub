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
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}&countrycodes=br`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Remove duplicates and format results
        const uniqueResults = data.reduce((acc: any[], current: any) => {
          const isDuplicate = acc.some(item => 
            item.display_name === current.display_name ||
            (item.lat === current.lat && item.lon === current.lon)
          );
          
          if (!isDuplicate) {
            acc.push({
              ...current,
              formatted_address: formatAddress(current)
            });
          }
          
          return acc;
        }, []);
        
        setSuggestions(uniqueResults.slice(0, 5));
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (suggestion: any) => {
    const address = suggestion.address || {};
    const parts = [];
    
    // Logradouro
    if (address.road || address.pedestrian || address.highway) {
      parts.push(address.road || address.pedestrian || address.highway);
    }
    
    // Bairro
    if (address.suburb || address.neighbourhood || address.city_district) {
      parts.push(address.suburb || address.neighbourhood || address.city_district);
    }
    
    // Cidade
    if (address.city || address.town || address.village || address.municipality) {
      parts.push(address.city || address.town || address.village || address.municipality);
    }
    
    // Estado
    if (address.state) {
      parts.push(address.state);
    }
    
    // CEP
    if (address.postcode) {
      parts.push(address.postcode);
    }
    
    return parts.filter(Boolean).join(', ');
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
              <div className="text-sm font-medium">{suggestion.formatted_address}</div>
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