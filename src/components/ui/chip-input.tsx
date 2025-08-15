import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ChipInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string[]
  onChange: (value: string[]) => void
}

export function ChipInput({
  value,
  onChange,
  className,
  ...props
}: ChipInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addChip = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
  }

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addChip(inputValue)
      setInputValue('')
    } else if (e.key === 'Backspace' && inputValue === '') {
      removeChip(value.length - 1)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((chip, idx) => (
        <Badge key={idx} className="flex items-center gap-1">
          {chip}
          <button
            type="button"
            onClick={() => removeChip(idx)}
            aria-label={`Remover ${chip}`}
          >
            ×
          </button>
        </Badge>
      ))}
      <input
        {...props}
        ref={inputRef}
        className="flex-1 bg-transparent outline-none min-w-[120px]"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export default ChipInput

