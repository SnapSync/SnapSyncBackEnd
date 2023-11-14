import { Users } from '@/models/users.model';
import { SnapSyncErrorType } from '@/utils/enum';
import { phone } from 'phone';

export const MIN_FULLNAME_LENGTH = 3;
export const MAX_FULLNAME_LENGTH = 64;
export const FULLNAME_REGEX = /^[a-zA-Z][a-zA-Z ]*$/;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const MIN_AGE = 13;

export const MAX_BIO_LENGTH = 150;

class ValidationService {}

export default ValidationService;
