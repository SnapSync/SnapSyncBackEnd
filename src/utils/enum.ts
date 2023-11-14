export enum SnapSyncErrorType {
  'HttpNotFoundError' = 'HttpNotFoundError',
  'HttpNotAuthorizedError' = 'HttpNotAuthorizedError',
  'HttpServerError' = 'HttpServerError',
  'HttpBadRequestError' = 'HttpBadRequestError',
  'HttpInternalServerError' = 'HttpInternalServerError',
  'HttpUnprocessableEntityError' = 'HttpUnprocessableEntityError', // 422

  'SnapSyncUserBannedError' = 'SnapSyncUserBannedError', // Utente bannato
  'SnapSyncMaxUserDevicesError' = 'SnapSyncMaxUserDevicesError', // Utente ha raggiunto il numero massimo di dispositivi associati al suo account

  'SnapSyncMinAgeError' = 'SnapSyncMinAgeError', // Utilizzato per la registrazione, se l'utente è minore dell'età minima: 13 anni
  'SnapSyncMinLengthError' = 'SnapSyncMinLengthError', // Se il campo è troppo corto
  'SnapSyncMaxLengthError' = 'SnapSyncMaxLengthError', // Se il campo è troppo lungo
  'SnapSyncInvalidFormatError' = 'SnapSyncInvalidFormatError', // Se il campo non supera il REGEX / formato
  'SnapSyncAlreadyExistsError' = 'SnapSyncAlreadyExistsError', // Se il campo esiste già nel database
}
