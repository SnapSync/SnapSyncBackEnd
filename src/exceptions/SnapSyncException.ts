export class SnapSyncException extends Error {
  public status: number;
  public message: string;
  public error: string | null;
  public errorKey: string | null;
  public data: any;
  public fields: string[] | null;
  // public requestId: string;

  constructor(
    status: number,
    message: string,
    error: string | null = null,
    errorKey: string | null = null,
    data: any = null,
    fields: string[] | null = null,
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.error = error;
    this.errorKey = errorKey;
    this.data = data;
    this.fields = fields;
  }
}
