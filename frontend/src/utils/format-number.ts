// https://numeraljs.com/
import numeral from 'numeral';

type InputValue = string | number | null | undefined;

export function fNumber(number: InputValue) {
  return numeral(number).format();
}

export function fCurrency(number: InputValue) {
  const format = number ? numeral(number).format('$0,0.00') : '';

  return result(format, '.00');
}

export function fPercent(number: InputValue) {
  const format = number ? numeral(Number(number) / 100).format('0.0%') : '';

  return result(format, '.0');
}

export function fShortenNumber(number: InputValue) {
  const format = number ? numeral(number).format('0.00a') : '';

  return result(format, '.00');
}

export function fBytes(number: InputValue) {
  const format = number ? numeral(number).format('0.0 b') : '';

  return result(format, '.0');
}

function result(format: string, key = '.00') {
  const isInteger = format.includes(key);

  return isInteger ? format.replace(key, '') : format;
}

// 将字节大小转换为可读的文件大小格式（B、KB、MB 或 GB）
export const formatBytes = (size: number | null | undefined) => {
  if (size == null || Number.isNaN(size)) {
    return '--';
  }

  const base = 1024; // 定义字节转换的基数

  if (size < 1) {
    return `${size.toFixed(2)} B`;
  }
  if (size < base) {
    return `${size.toFixed(2)} B`;
  }
  if (size < base ** 2) {
    return `${(size / base).toFixed(2)} KB`;
  }
  if (size < base ** 3) {
    return `${(size / base / base).toFixed(2)} MB`;
  }
  return `${(size / base / base / base).toFixed(2)} GB`;
};
