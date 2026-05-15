'use client'

import ReactSelect, { type SingleValue } from 'react-select'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface Option {
  value: number
  label: string
  product: Product
}

interface Props {
  products: Product[]
  value: number | ''
  onChange: (productId: number | '', product: Product | null) => void
  placeholder?: string
  isDisabled?: boolean
}

export function ProductSelect({
  products,
  value,
  onChange,
  placeholder = 'পণ্য বেছে নিন...',
  isDisabled,
}: Props) {
  const options: Option[] = products.map(p => ({
    value: p.id,
    label: `${p.name}`,
    product: p,
  }))

  const selected = options.find(o => o.value === value) ?? null

  return (
    <ReactSelect<Option>
      options={options}
      value={selected}
      onChange={(opt: SingleValue<Option>) => onChange(opt?.value ?? '', opt?.product ?? null)}
      placeholder={placeholder}
      noOptionsMessage={() => 'কোনো পণ্য পাওয়া যায়নি'}
      isDisabled={isDisabled}
      unstyled
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      classNames={{
        control: ({ isFocused }) =>
          cn(
            'flex min-h-10 w-full rounded-lg border bg-background px-3 py-1.5 text-sm transition-all shadow-sm cursor-pointer',
            isFocused
              ? 'border-primary ring-2 ring-primary/20 outline-none'
              : 'border-input hover:border-primary/50'
          ),
        placeholder: () => 'text-muted-foreground text-sm',
        input: () => 'text-foreground text-sm',
        singleValue: () => 'text-foreground text-sm font-medium',
        menu: () =>
          'mt-1.5 rounded-xl border border-border bg-background shadow-xl overflow-hidden',
        menuList: () => 'py-1.5 max-h-52',
        option: ({ isFocused, isSelected }) =>
          cn(
            'px-3 py-2.5 text-sm cursor-pointer transition-colors',
            isSelected && 'bg-primary text-primary-foreground font-medium',
            !isSelected && isFocused && 'bg-accent text-accent-foreground'
          ),
        noOptionsMessage: () => 'px-3 py-3 text-sm text-muted-foreground text-center',
        dropdownIndicator: () => 'text-muted-foreground pl-1',
        clearIndicator: () => 'text-muted-foreground',
        indicatorSeparator: () => 'bg-border mx-1',
      }}
    />
  )
}
