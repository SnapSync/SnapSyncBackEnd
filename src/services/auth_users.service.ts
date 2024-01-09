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
} from '@/utils/costants';
import { phone } from 'phone';
import { CreateAuthUserDto } from '@/dtos/auth_users.dto';
import { isLeapYear } from '@/utils/util';
import { SnapSyncErrorType } from '@/utils/enum';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { Users } from '@/models/users.model';

class AuthUserService {
  public async findAuthUserBySessionId(sessionId: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().andWhere('sessionId', sessionId).first();
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    return findOne;
  }

  public async createAuthUser(data: CreateAuthUserDto): Promise<AuthUser> {
    // if (isEmpty(data)) throw new HttpException(422, 'errors.data_is_empty', 'Ops! Data is empty');

    // Genero un sessionId
    const sessionId = uuidv4();

    // Controllo se esiste già un authUser con questo sessionId, non dovrebbe mai succedere
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findOne({ sessionId });
    if (findAuthUser) throw new SnapSyncException(409, 'Conflict');

    const createdAuthUser = await AuthUsers.query().insertAndFetch({ sessionId: sessionId, ...data });
    return createdAuthUser;
  }

  public async updateAuthUserFullName(id: number, fullName: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const trimmedFullName = fullName.trim();

    // Controllo se il nome e cognome è valido, in teoria non dovrebbe mai succedere, poichè ci dovrebbe essere la validazione nel controller
    if (trimmedFullName.length < MIN_FULLNAME_LENGTH || trimmedFullName.length > MAX_FULLNAME_LENGTH || !FULLNAME_REGEX.test(trimmedFullName)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['fullname']);
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { fullname: trimmedFullName });

    return updatedAuthUser;
  }

  public async updateAuthUserDateOfBirth(id: number, yearOfBirth: number, monthOfBirth: number, dayOfBirth: number): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    /**
     * Must be a valid date
     * Must be at least 13 years old
     */

    // Controllo se la data è valida
    const date = new Date(Date.UTC(yearOfBirth, monthOfBirth - 1, dayOfBirth));
    if (isNaN(date.getTime())) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['yearOfBirth', 'monthOfBirth', 'dayOfBirth']);
    }

    // Controllo se la data è precedente o uguale ad oggi
    const now = new Date();
    if (date > now) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['yearOfBirth', 'monthOfBirth', 'dayOfBirth']);
    }

    // Controllo se l'anno di nascita è maggiore del 1900
    if (yearOfBirth < 1900) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['yearOfBirth']);
    }

    // Controllo se l'utente ha almeno 13 anni
    const minDate = new Date(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate());
    if (date > minDate) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, SnapSyncErrorType.SnapSyncMinAgeError, undefined, [
        'yearOfBirth',
        'monthOfBirth',
        'dayOfBirth',
      ]);
    }

    // Controllo se la data esiste, per esempio 31/02/2021 non esiste
    const daysInMonth = [31, isLeapYear(yearOfBirth) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (dayOfBirth < 1 || dayOfBirth > daysInMonth[monthOfBirth - 1]) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['dayOfBirth']);
    }

    // Verificare se i valori della data corrispondono a quelli inseriti
    if (date.getFullYear() !== yearOfBirth || date.getMonth() !== monthOfBirth - 1 || date.getDate() !== dayOfBirth) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['yearOfBirth', 'monthOfBirth', 'dayOfBirth']);
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { dateOfBirth: date });

    return updatedAuthUser;
  }

  public async updateAuthUserPhoneNumber(id: number, phoneNumber: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const phoneNumberResult = phone(phoneNumber);
    if (!phoneNumberResult.isValid) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['phoneNumber']);
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { phoneNumber: phoneNumberResult.phoneNumber });

    return updatedAuthUser;
  }

  public async updateAuthUserOtpSendedAt(id: number, otpSendedAt: Date): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { otpSendedAt });

    return updatedAuthUser;
  }

  public async updateAuthUserPhoneNumberVerified(id: number, phoneNumberVerified: boolean): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { isPhoneNumberVerified: phoneNumberVerified });

    return updatedAuthUser;
  }

  public async validateAuthUserUsername(id: number, username: string): Promise<boolean> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    // Rimuoivo gli spazi prima e dopo e lo rende lowercase
    const trimmedUsername = username.trim().toLocaleLowerCase();

    /**
     * MinLength: 3
     * MaxLength: 30
     * Only letters, numbers, and underscores
     * Must start with a letter
     * Unique
     */

    if (trimmedUsername.length < MIN_USERNAME_LENGTH || trimmedUsername.length > MAX_USERNAME_LENGTH || !USERNAME_REGEX.test(trimmedUsername)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['username']);
    }

    const alreadyExists = await Users.query().whereNotDeleted().andWhere('username', trimmedUsername).first();
    if (alreadyExists) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['username']);
    }

    return true;
  }

  public async updateAuthUserUsername(id: number, username: string): Promise<AuthUser> {
    const findOne = await AuthUsers.query().whereNotDeleted().findById(id);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    // Rimuoivo gli spazi prima e dopo e lo rende lowercase
    const trimmedUsername = username.trim().toLocaleLowerCase();

    /**
     * MinLength: 3
     * MaxLength: 30
     * Only letters, numbers, and underscores
     * Must start with a letter
     * Unique
     */

    if (trimmedUsername.length < MIN_USERNAME_LENGTH || trimmedUsername.length > MAX_USERNAME_LENGTH || !USERNAME_REGEX.test(trimmedUsername)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['username']);
    }

    const alreadyExists = await Users.query().whereNotDeleted().andWhere('username', trimmedUsername).first();
    if (alreadyExists) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['username']);
    }

    const updatedAuthUser = await AuthUsers.query().patchAndFetchById(id, { username: trimmedUsername });

    return updatedAuthUser;
  }
}

export default AuthUserService;
