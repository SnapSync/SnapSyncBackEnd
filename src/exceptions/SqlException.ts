export class SqlException extends Error {
  public code: string;
  public errno: number;
  public sqlMessage: string;
  public sqlState: string;
  public index: number;
  public sql: string;

  public constructor(error: any) {
    super(error.message);

    // let status = 500;
    // let message = 'Something went wrong';

    // // Struttura del messaggio di errore: status-message
    // let defaultMessageText = '500-Something went wrong';
    // if (error && error.sqlMessage) defaultMessageText = error.sqlMessage;

    // let splittedMessage = defaultMessageText.split('-');
    // if (splittedMessage.length > 1) {
    //   status = Number(splittedMessage[0]);
    //   message = splittedMessage[1];
    // }

    this.code = error.code;
    this.errno = error.errno;
    this.sqlMessage = error.sqlMessage;
    this.sqlState = error.sqlState;
    this.index = error.index;
    this.sql = error.sql;
  }
}
