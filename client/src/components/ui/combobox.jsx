import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const Combobox = React.forwardRef(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder = 'Select option...',
      searchPlaceholder = 'Search...',
      emptyMessage = 'No results found.',
      open: openProp,
      onOpenChange,
      className,
      buttonClassName,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = openProp ?? internalOpen;

    const handleOpenChange = (nextOpen) => {
      if (openProp === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const selectedOption = React.useMemo(
      () => options.find((option) => option?.value === value) ?? null,
      [options, value]
    );

    const handleSelect = (optionValue) => {
      if (optionValue === value) {
        handleOpenChange(false);
        return;
      }

      onValueChange?.(optionValue);
      handleOpenChange(false);
    };

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type='button'
            role='combobox'
            aria-expanded={open}
            variant='outline'
            className={cn('w-full justify-between', buttonClassName)}
          >
            {selectedOption?.label ?? placeholder}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn('p-0', className)} align='start'>
          <Command {...props}>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

Combobox.displayName = 'Combobox';

export { Combobox };
