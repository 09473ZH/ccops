export interface Result<T = any> {
  code: number;
  msg: string;
  data?: T;
}
