import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Plus } from 'lucide-react';

interface SearchableInputProps<T> {
  items: T[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemSubLabel?: (item: T) => string;
  filterItems: (items: T[], searchTerm: string) => T[];
  createNewLabel?: string;
}

export function SearchableInput<T>({
  items,
  value,
  onValueChange,
  onCreateNew,
  placeholder,
  className,
  getItemValue,
  getItemLabel,
  getItemSubLabel,
  filterItems,
  createNewLabel = "Criar novo",
}: SearchableInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update display value when value changes
  useEffect(() => {
    if (value) {
      const selectedItem = items.find(item => getItemValue(item) === value);
      if (selectedItem) {
        setDisplayValue(getItemLabel(selectedItem));
        setSearchTerm('');
      }
    } else {
      setDisplayValue('');
      setSearchTerm('');
    }
  }, [value, items, getItemValue, getItemLabel]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If no value is selected, clear the search term
        if (!value) {
          setDisplayValue('');
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const currentSearchTerm = isOpen ? searchTerm : displayValue;
  const filteredItems = filterItems(items, currentSearchTerm);
  const hasExactMatch = filteredItems.some(item => 
    getItemLabel(item).toLowerCase() === currentSearchTerm.toLowerCase()
  );
  const showCreateOption = onCreateNew && currentSearchTerm && !hasExactMatch;

  const handleInputChange = (newValue: string) => {
    setSearchTerm(newValue);
    setDisplayValue(newValue);
    if (!isOpen) setIsOpen(true);
  };

  const handleItemSelect = (item: T) => {
    const itemValue = getItemValue(item);
    const itemLabel = getItemLabel(item);
    
    onValueChange(itemValue);
    setDisplayValue(itemLabel);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew && currentSearchTerm) {
      onCreateNew(currentSearchTerm);
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (displayValue && !searchTerm) {
      setSearchTerm(displayValue);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={currentSearchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn("mobile-input pr-8", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-popover border shadow-lg">
          {filteredItems.length === 0 && !showCreateOption ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="p-1">
              {filteredItems.map((item, index) => {
                const isSelected = getItemValue(item) === value;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-3 py-2 h-auto text-left font-normal hover:bg-accent",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isSelected && <Check className="h-4 w-4" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{getItemLabel(item)}</div>
                        {getItemSubLabel && (
                          <div className="text-xs text-muted-foreground truncate">
                            {getItemSubLabel(item)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
              
              {showCreateOption && (
                <>
                  {filteredItems.length > 0 && <div className="border-t my-1" />}
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 text-left font-normal hover:bg-accent text-primary"
                    onClick={handleCreateNew}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createNewLabel}: "{currentSearchTerm}"
                  </Button>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}