import { Button, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import IconifyIcon from '@/components/icon/iconify-icon';

interface OutputPanelProps {
  output: string[];
  autoScroll: boolean;
  onAutoScrollChange: (checked: boolean) => void;
  onClear: () => void;
  isDarkMode: boolean;
}

export function OutputPanel({
  output,
  autoScroll,
  onAutoScrollChange,
  onClear,
  isDarkMode,
}: OutputPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-[300px] flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{t('quick-command.output.title')}</span>
        <div className="flex items-center gap-2">
          <Switch
            size="small"
            checked={autoScroll}
            onChange={onAutoScrollChange}
            checkedChildren={t('quick-command.auto-scroll')}
            unCheckedChildren={t('quick-command.manual-scroll')}
          />
          <Button
            type="text"
            size="small"
            onClick={onClear}
            icon={<IconifyIcon icon="material-symbols:delete-outline" size={14} />}
            className="hover:text-red-500 flex items-center gap-1 text-gray-500"
          >
            {t('quick-command.clear')}
          </Button>
        </div>
      </div>

      <div
        className={`
          flex-1 overflow-auto rounded-md border border-gray-200 p-3 font-mono text-sm
          ${isDarkMode ? 'border-gray-700 bg-[#1e1e1e] text-gray-200' : 'bg-white text-gray-800'}
        `}
        id="output-container"
      >
        {output.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            {t('quick-command.output.empty')}
          </div>
        ) : (
          <div className="space-y-0.5">
            {output.map((line, index) => (
              <div key={index} className="leading-6">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
