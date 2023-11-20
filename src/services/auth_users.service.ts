import { HttpException } from '@/exceptions/HttpException';
import { AuthUser } from '@/interfaces/auth_users.interface';
import { AuthUsers } from '@/models/auth_users.model';
import { v4 as uuidv4 } from 'uuid';
import {
  FULLNAME_REGEX,
  MAX_FULLNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_AGE,
  MIN_FULLNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_REGEX,
} from './validation.service';
import { phone } from 'phone';
import { Devices } from '@/models/devices.model';
import { CreateAuthUserDto } from '@/dtos/auth_users.dto';
import { isEmpty, isLeapYear } from '@/utils/util';
import { SnapSyncErrorType } from '@/utils/enum';

class AuthUserService {
  public async findAuthUserBySessionId(sessionId: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().andWhere('sessionId', sessionId).first();
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    return findOne;
  }

  public async createAuthUser(data: CreateAuthUserDto): Promise<AuthUser> {
    if (isEmpty(data)) throw new HttpException(422, 'errors.data_is_empty', 'Ops! Data is empty');

    const findDevice = await Devices.query().whereNotDeleted().findById(data.deviceId);
    if (!findDevice) {
      throw new HttpException(404, 'errors.device_not_found', 'Device not found');
    }

    // Genero un sessionId
    const sessionId = uuidv4();

    // Controllo se esiste già un authUser con questo sessionId, non dovrebbe mai succedere
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findOne({ sessionId });
    if (findAuthUser) throw new HttpException(409, 'errors.something_went_wrong', 'Ops! Something went wrong');

    const createdAuthUser = await AuthUsers.query().insertAndFetch({ sessionId, deviceId: data.deviceId });
    return createdAuthUser;
  }

  public async updateAuthUserFullName(id: number, fullName: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found');

    const trimmedFullName = fullName.trim();

    // Controllo se il nome e cognome è valido, in teoria non dovrebbe mai succedere, poichè ci dovrebbe essere la validazione nel controller
    if (trimmedFullName.length < MIN_FULLNAME_LENGTH) {
      throw new HttpException(
        422,
        'errors.validation.invalid_fullname',
        `Fullname must be at least ${MIN_FULLNAME_LENGTH} characters long`,
        undefined,
        SnapSyncErrorType.SnapSyncMinLengthError,
      );
    }

    if (trimmedFullName.length > MAX_FULLNAME_LENGTH) {
      throw new HttpException(
        422,
        'errors.validation.invalid_fullname',
        `Fullname must be at most ${MAX_FULLNAME_LENGTH} characters long`,
        undefined,
        SnapSyncErrorType.SnapSyncMaxLengthError,
      );
    }

    if (FULLNAME_REGEX.test(trimmedFullName) === false) {
      throw new HttpException(
        422,
        'errors.validation.invalid_fullname',
        'Fullname must be a valid fullname',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { fullName: trimmedFullName });

    return updatedAuthUser;
  }

  public async updateAuthUserDateOfBirth(id: number, yearOfBirth: number, monthOfBirth: number, dayOfBirth: number): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found');

    /**
     * Must be a valid date
     * Must be at least 13 years old
     */

    // Controllo se la data è valida
    const date = new Date(Date.UTC(yearOfBirth, monthOfBirth - 1, dayOfBirth));
    if (isNaN(date.getTime())) {
      throw new HttpException(
        422,
        'errors.invalid_date_of_birth',
        'Date of birth is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    // Controllo se la data è precedente o uguale ad oggi
    const now = new Date();
    if (date > now) {
      throw new HttpException(
        422,
        'errors.invalid_date_of_birth',
        'Date of birth is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    // Controllo se l'anno di nascita è maggiore del 1900
    if (yearOfBirth < 1900) {
      throw new HttpException(
        422,
        'errors.invalid_date_of_birth',
        'Date of birth is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    // Controllo se l'utente ha almeno 13 anni
    const minDate = new Date(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate());
    if (date > minDate) {
      throw new HttpException(
        422,
        'errors.validation.min_age',
        'You must be at least 13 years old.',
        {
          minAge: MIN_AGE,
        },
        SnapSyncErrorType.SnapSyncMinAgeError,
      );
    }

    // Controllo se la data esiste, per esempio 31/02/2021 non esiste
    const daysInMonth = [31, isLeapYear(yearOfBirth) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (dayOfBirth < 1 || dayOfBirth > daysInMonth[monthOfBirth - 1]) {
      throw new HttpException(
        422,
        'errors.invalid_date_of_birth',
        'Date of birth is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    // Verificare se i valori della data corrispondono a quelli inseriti
    if (date.getFullYear() !== yearOfBirth || date.getMonth() !== monthOfBirth - 1 || date.getDate() !== dayOfBirth) {
      throw new HttpException(
        422,
        'errors.invalid_date_of_birth',
        'Date of birth is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { dateOfBirth: date });

    return updatedAuthUser;
  }

  public async updateAuthUserPhoneNumber(id: number, phoneNumber: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found');

    const phoneNumberResult = phone(phoneNumber);
    if (!phoneNumberResult.isValid) {
      throw new HttpException(
        422,
        'errors.invalid_phone_number',
        'Phone number is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { phoneNumber: phoneNumberResult.phoneNumber });

    return updatedAuthUser;
  }

  public async updateAuthUserOtpSendedAt(id: number, otpSendedAt: Date): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found');

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { otpSendedAt });

    return updatedAuthUser;
  }

  public async updateAuthUserPhoneNumberVerified(id: number, phoneNumberVerified: boolean): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found');

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { isPhoneNumberVerified: phoneNumberVerified });

    return updatedAuthUser;
  }

  public async updateAuthUserUsername(id: number, username: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found');

    // Rimuoivo gli spazi prima e dopo e lo rende lowercase
    const trimmedUsername = username.trim().toLocaleLowerCase();

    /**
     * MinLength: 3
     * MaxLength: 30
     * Only letters, numbers, and underscores
     * Must start with a letter
     * Unique
     */

    if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
      throw new HttpException(
        422,
        'errors.validation.invalid_username',
        'Username must be at least 3 characters long.',
        undefined,
        SnapSyncErrorType.SnapSyncMinLengthError,
      );
    }

    if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
      throw new HttpException(
        422,
        'errors.validation.invalid_username',
        'Username must be at most 30 characters long.',
        undefined,
        SnapSyncErrorType.SnapSyncMaxLengthError,
      );
    }

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      throw new HttpException(
        422,
        'errors.validation.invalid_username',
        'Username must only contain letters, numbers, and underscores.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    const alreadyExists = await AuthUsers.query().whereNotDeleted().andWhere('username', trimmedUsername).first();
    if (alreadyExists) {
      throw new HttpException(
        409,
        'errors.validation.username_already_exists',
        'Username is already taken.',
        undefined,
        SnapSyncErrorType.SnapSyncAlreadyExistsError,
      );
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { username: trimmedUsername });

    return updatedAuthUser;
  }
}

export default AuthUserService;
