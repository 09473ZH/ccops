import { Progress, Tooltip } from 'antd';

interface MetricsProgressProps {
  value: number;
  title: string;
  width?: number;
}

const getUsageColor = (percent: number) => {
  if (percent > 80) return '#e55649';
  if (percent > 60) return '#FB9800';
  return '#87d068';
};

export function MetricsProgress({ value, title, width = 80 }: MetricsProgressProps) {
  if (typeof value !== 'number') return <>--</>;

  return (
    <Tooltip title={`${title}: ${value.toFixed(2)}%`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '12px' }}>{value.toFixed(2)}%</span>
        <Progress
          strokeLinecap="butt"
          percent={value}
          size={[width, 6]}
          showInfo={false}
          strokeColor={getUsageColor(value)}
        />
      </div>
    </Tooltip>
  );
}
