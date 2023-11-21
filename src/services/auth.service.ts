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
        tokenData: td,
        accessToken: `${selector}:${plainTextValidator}`,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  public async signUpByAuthUser(authUserId: number): Promise<LogInResponse> {
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findById(authUserId);
    if (!findAuthUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo se tutti i campi sono stati impostati
    if (!findAuthUser.fullname) throw new SnapSyncException(400, 'Bad Request');
    if (!findAuthUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');
    if (!findAuthUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
    if (!boolean(findAuthUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');
    if (!findAuthUser.username) throw new SnapSyncException(400, 'Bad Request');

    const phoneNumberResult = phone(findAuthUser.phoneNumber);
    if (!phoneNumberResult.isValid) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['phoneNumber']);
    }

    // Controllo se esiste già un utente con lo stesso username
    const findUserByUsername = await Users.query().whereNotDeleted().andWhere('username', findAuthUser.username).first();
    if (findUserByUsername) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['username']);
    }

    // Controllo se esiste già un utente con lo stesso numero di telefono
    const findUserByPhoneNumber = await Users.query().whereNotDeleted().andWhere('phoneNumber', findAuthUser.phoneNumber).first();
    if (findUserByPhoneNumber) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['phoneNumber']);
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
        username: findAuthUser.username,
        fullname: findAuthUser.fullname,
        phoneNumber: findAuthUser.phoneNumber,
        dateOfBirth: findAuthUser.dateOfBirth,
      });

      // Elimito l'auth_user
      await AuthUsers.query(trx).deleteById(authUserId);

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
        tokenData: td,
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

    const td = this.createToken(findUser);

    // Aggiorno il validator
    const newPlainTextValidator = uuidv4();
    const newHashedValidator = sha256(newPlainTextValidator);

    await AuthTokens.query().patchAndFetchById(findAuthToken.id, {
      hashedValidator: newHashedValidator,
      lastUsedAt: new Date(),
    });

    return {
      tokenData: td,
      accessToken: `${selector}:${newPlainTextValidator}`,
    };
  }

  public async login(id: number): Promise<TokenData> {
    const user = await Users.query().whereNotDeleted().findById(id);
    if (!user) new SnapSyncException(401, 'Unauthorized');

    if (boolean(user.isBanned)) throw new SnapSyncException(403, 'Forbidden', undefined, SnapSyncErrorType.SnapSyncUserBannedError);

    const tokenData = this.createToken(user);

    return tokenData;
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
