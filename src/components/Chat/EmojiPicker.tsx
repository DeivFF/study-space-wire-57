import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger: React.ReactNode;
}

const COMMON_REACTIONS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '👏', '🔥', '💯', '🎉', '✨', '👌',
  '😊', '😍', '🤔', '😅', '😎', '🙄',
  '💪', '🚀', '⭐', '❓', '❗', '💡'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, trigger }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-6 gap-1">
          {COMMON_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-accent text-xl"
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};