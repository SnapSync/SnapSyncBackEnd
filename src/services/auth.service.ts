import { sign, verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { DataStoredInToken, LogInResponse, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { Users } from '@/models/users.model';
import { AuthUsers } from '@/models/auth_users.model';
import { boolean } from 'boolean';
import { phone } from 'phone';
import { SnapSyncErrorType } from '@/utils/enum';
import { v4 as uuidv4 } from 'uuid';
import { sha256 } from 'js-sha256';
import { AuthTokens } from '@/models/auth_tokens.model';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { UsersSettings } from '@/models/users_settings.model';
import moment from 'moment';
import { Devices } from '@/models/devices.model';
import { VexoTokens } from '@/models/vexo_tokens.model';
const zodiac = require('zodiac-signs')('en'); // Lo utilizzo per calcolare lo zodiaco

class AuthService {
  public async loginByAuthUser(authUserId: number): Promise<LogInResponse> {
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findById(authUserId);
    if (!findAuthUser) throw new SnapSyncException(404, 'Not Found');

    if (!findAuthUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
    if (!boolean(findAuthUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');

    const findUserByPhoneNumber = await Users.query().whereNotDeleted().andWhere('phoneNumber', findAuthUser.phoneNumber).first();
    if (!findUserByPhoneNumber) {
      await AuthUsers.query().deleteById(authUserId);
      throw new SnapSyncException(404, 'Not Found');
    }

    // Controllo se l'utente è stato bannato
    if (boolean(findUserByPhoneNumber.isBanned)) {
      await AuthUsers.query().deleteById(authUserId);
      throw new SnapSyncException(403, 'Forbidden', undefined, SnapSyncErrorType.SnapSyncUserBannedError);
    }

    const trx = await Users.startTransaction();

    try {
      const td = this.createToken(findUserByPhoneNumber);

      // Elimino l'auth_user
      await AuthUsers.query(trx).deleteById(authUserId);

      // Recupero il vexo_token
      const vexoToken = await VexoTokens.query(trx).where('userId', findUserByPhoneNumber.id).first();
      if (!vexoToken) throw new SnapSyncException(404, 'Not Found');

      // Creo l'authToken per loggarsi al prossimo avvio dell'app
      const selector = uuidv4();
      const plainTextValidator = uuidv4();
      const hashedValidator = sha256(plainTextValidator);

      await AuthTokens.query(trx).insert({
        userId: findUserByPhoneNumber.id,
        selector: selector,
        hashedValidator: hashedValidator,
      });

      // Committo le modifiche
      await trx.commit();

      return {
        userId: findUserByPhoneNumber.id,
        tokenData: td,
        vexoToken: vexoToken.token,
        accessToken: `${selector}:${plainTextValidator}`,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  public async signUpByAuthUser(authUserId: number, username: string): Promise<LogInResponse> {
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findById(authUserId);
    if (!findAuthUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo se tutti i campi sono stati impostati
    if (!findAuthUser.fullname) throw new SnapSyncException(400, 'Bad Request');
    if (!findAuthUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');
    if (!findAuthUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
    if (!boolean(findAuthUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');
    // if (!findAuthUser.username) throw new SnapSyncException(400, 'Bad Request');

    const phoneNumberResult = phone(findAuthUser.phoneNumber);
    if (!phoneNumberResult.isValid) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['phoneNumber']);
    }

    // Controllo se esiste già un utente con lo stesso username
    const trimmedUsername = username.trim().toLocaleLowerCase();
    const findUserByUsername = await Users.query().whereNotDeleted().andWhere('username', trimmedUsername).first();
    if (findUserByUsername) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['username']);
    }

    // Controllo se esiste già un utente con lo stesso numero di telefono
    const findUserByPhoneNumber = await Users.query().whereNotDeleted().andWhere('phoneNumber', findAuthUser.phoneNumber).first();
    if (findUserByPhoneNumber) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['phoneNumber']);
    }

    // Estraggo il giorno e il mese dalla data di nascita
    const day = moment(findAuthUser.dateOfBirth).date();
    const month = moment(findAuthUser.dateOfBirth).month() + 1; // Gennaio è 0

    const zSign:
      | number
      | {
          name: string; // Sarà in inglese
          element: string;
          stone: string;
          symbol: string;
          dateMin: string;
          dateMax: string;
        } = zodiac.getSignByDate({ day: day, month: month });

    if (typeof zSign === 'number') {
      // @see -> https://www.npmjs.com/package/zodiac-signs#error-management

      // Day -> [1;31] or [1;30] or [1;29] -> -1
      // Month -> [1;12] -> -1
      // Name  -> zodiac signs' names -> -2
      // Symbol -> zodiac signs' symbols -> -2
      throw new SnapSyncException(400, 'Bad Request');
    }

    const trx = await Users.startTransaction();

    // Sarà l'immagine di default
    // let firstUsernameChar = findAuthUser.username.charAt(0);
    // const key = `letters/${firstUsernameChar.toUpperCase()}.jpeg`;

    // const phoneNumberOnlyDigits = phoneNumberResult.phoneNumber.replace(/\D/g, ''); // Rimuovo tutti i caratteri non numerici
    // const phoneNumberCountryIso2 = phoneNumberResult.countryIso2;

    try {
      // Creo l'utente
      const createdUser = await Users.query(trx).insertAndFetch({
        username: trimmedUsername,
        fullname: findAuthUser.fullname,
        phoneNumber: findAuthUser.phoneNumber,
        dateOfBirth: findAuthUser.dateOfBirth,
        zodiacSignSymbol: zSign.symbol,
        zodiacSignName: zSign.name,
      });

      // Elimito l'auth_user
      await AuthUsers.query(trx).deleteById(authUserId);

      // Creo lo users_settings
      await UsersSettings.query(trx).insert({
        userId: createdUser.id,
        allowSyncContacts: false,
      });

      // Creo il vexo_token
      const uuid = uuidv4();
      const token = sha256(uuid);
      await VexoTokens.query(trx).insert({
        userId: createdUser.id,
        token: token,
      });

      // Creo l'authToken per loggarsi al prossimo avvio dell'app
      const selector = uuidv4();
      const plainTextValidator = uuidv4();
      const hashedValidator = sha256(plainTextValidator);

      await AuthTokens.query(trx).insert({
        userId: createdUser.id,
        selector: selector,
        hashedValidator: hashedValidator,
      });

      // Committo le modifiche
      await trx.commit();

      // Creo il token
      const td = this.createToken(createdUser);

      return {
        userId: createdUser.id,
        tokenData: td,
        vexoToken: token,
        accessToken: `${selector}:${plainTextValidator}`,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  public async loginByAuthToken(accessToken: string): Promise<LogInResponse> {
    const [selector, plainTextValidator] = accessToken.split(':');

    // Cerco l'authToken tramite il selector
    const findAuthToken = await AuthTokens.query().andWhere('selector', selector).first();
    if (!findAuthToken) throw new SnapSyncException(404, 'Not Found');

    // Controllo se il validator è corretto
    const hashedValidator = sha256(plainTextValidator);
    if (hashedValidator !== findAuthToken.hashedValidator) {
      // TODO: Capire se devo eliminare tutti gli authTokens associati a questo utente
      throw new SnapSyncException(401, 'Unauthorized');
    }

    // TODO: Controllo se l'authToken è scaduto

    // Recupero l'utente
    const findUser = await Users.query().whereNotDeleted().findById(findAuthToken.userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');
    // Controllo se l'utente è stato bannato
    if (boolean(findUser.isBanned)) throw new SnapSyncException(403, 'Forbidden', undefined, SnapSyncErrorType.SnapSyncUserBannedError);

    // Recupero il vexo_token
    const vexoToken = await VexoTokens.query().where('userId', findUser.id).first();
    if (!vexoToken) throw new SnapSyncException(404, 'Not Found');

    const td = this.createToken(findUser);

    // Aggiorno il validator
    const newPlainTextValidator = uuidv4();
    const newHashedValidator = sha256(newPlainTextValidator);

    await AuthTokens.query().patchAndFetchById(findAuthToken.id, {
      hashedValidator: newHashedValidator,
      lastUsedAt: new Date(),
    });

    return {
      userId: findUser.id,
      tokenData: td,
      vexoToken: vexoToken.token,
      accessToken: `${selector}:${newPlainTextValidator}`,
    };
  }

  public async login(id: number): Promise<LogInResponse> {
    const user = await Users.query().whereNotDeleted().findById(id);
    if (!user) throw new SnapSyncException(401, 'Unauthorized');

    if (boolean(user.isBanned)) throw new SnapSyncException(403, 'Forbidden', undefined, SnapSyncErrorType.SnapSyncUserBannedError);

    const vexoToken = await VexoTokens.query().where('userId', user.id).first();
    if (!vexoToken) throw new SnapSyncException(404, 'Not Found');

    const tokenData = this.createToken(user);

    // Creo l'authToken per loggarsi al prossimo avvio dell'app
    const selector = uuidv4();
    const plainTextValidator = uuidv4();
    const hashedValidator = sha256(plainTextValidator);

    await AuthTokens.query().insert({
      userId: user.id,
      selector: selector,
      hashedValidator: hashedValidator,
    });

    return {
      tokenData,
      vexoToken: vexoToken.token,
      userId: user.id,
      accessToken: `${selector}:${plainTextValidator}`,
    };
  }

  public async refreshToken(token: string): Promise<TokenData> {
    const secretKey: string = SECRET_KEY;
    const verificationResponse = (await verify(token, secretKey)) as DataStoredInToken;
    const userId = verificationResponse.id;
    const findUser: User = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) new SnapSyncException(401, 'Unauthorized');

    // Se l'account è stato bannato non faccio refresh del token
    if (boolean(findUser.isBanned)) throw new SnapSyncException(403, 'Forbidden', undefined, SnapSyncErrorType.SnapSyncUserBannedError);

    const tokenData = this.createToken(findUser);

    return tokenData;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60; // 1 hour
    const token = sign(dataStoredInToken, secretKey, { expiresIn });
    const refreshToken = sign(dataStoredInToken, secretKey, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days

    const td: TokenData = { expiresIn, token, refreshToken };

    return td;
  }

  // public createCookie(tokenData: TokenData): string {
  //   return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  // }
}

export default AuthService;
