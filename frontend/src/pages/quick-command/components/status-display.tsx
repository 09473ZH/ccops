import { useTranslation } from 'react-i18next';

export type CommandEvent = 'running' | 'end' | null;

interface StatusDisplayProps {
  event: CommandEvent;
  duration: number;
}

export function StatusDisplay({ event, duration }: StatusDisplayProps) {
  const { t } = useTranslation();

  const renderStatus = () => {
    const statusMap = {
      running: <span className="text-blue-500">{t('quick-command.status.running')}</span>,
      end: <span className="text-green-500">{t('quick-command.status.ended')}</span>,
      null: <span>{t('quick-command.status.pending')}</span>,
    } as const;
    return statusMap[event || 'null'];
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">{t('quick-command.status.title')}:</span>
        {renderStatus()}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">{t('quick-command.duration.title')}:</span>
        <span>
          {duration.toFixed(2)} {t('quick-command.duration.unit')}
        </span>
      </div>
    </div>
  );
}
