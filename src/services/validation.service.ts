import { Users } from '@/models/users.model';
import { SnapSyncErrorType } from '@/utils/enum';
import { phone } from 'phone';

export const MIN_FULLNAME_LENGTH = 3;
export const MAX_FULLNAME_LENGTH = 64;
// Devo accettare anche le lettere accentate
export const FULLNAME_REGEX =
  /^[a-zA-Z][a-zA-Z \u00C0\u00c1\u00c8\u00c9\u00cc\u00cd\u00d2\u00d3\u00d9\u00da\u00e0\u00e1\u00e8\u00e9\u00ec\u00ed\u00f2\u00f3\u00f9\u00fa]*$/;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const MIN_AGE = 13;

export const MAX_BIO_LENGTH = 150;

class ValidationService {}

export default ValidationService;
