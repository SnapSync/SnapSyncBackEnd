import { $Dictionary } from 'i18next/typescript/helpers';
import { TOptions } from 'i18next/typescript/options';

export class HttpException extends Error {
  public status: number;
  public i18nKey: string;
  public i: TOptions<$Dictionary>;
  public message: string;
  public type: string;

  constructor(status: number, i18nKey: string, message: string, i18nOptions?: TOptions<$Dictionary>, type?: string) {
    super(message);
    this.status = status;
    this.message = message;
    this.i18nKey = i18nKey;
    this.type = type || 'HttpException';
    this.i = i18nOptions || {};
  }
}
