import moment from 'moment';

export function formatDateTime(dateTime: string | Date): string {
  return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
}

export function formatTimeAgo(dateTime: string | Date): string {
  const diffInSeconds = Math.floor((Date.now() - new Date(dateTime).getTime()) / 1000);
  if (diffInSeconds < 0) return '刚刚';

  const timeUnits = [
    { unit: '天', value: 86400 },
    { unit: '小时', value: 3600 },
    { unit: '分钟', value: 60 },
    { unit: '秒', value: 1 },
  ];

  const result = timeUnits.find(({ value }) => diffInSeconds >= value);
  if (result) {
    return `${Math.floor(diffInSeconds / result.value)} ${result.unit}前`;
  }

  return '刚刚';
}
