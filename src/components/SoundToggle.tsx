import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SoundToggleProps {
  soundEnabled: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ soundEnabled, onToggle }: SoundToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary border border-border"
          aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-primary" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{soundEnabled ? 'Mute sounds' : 'Enable sounds'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

