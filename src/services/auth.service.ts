import { sign, verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { DataStoredInToken, LogInResponse, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { Users } from '@/models/users.model';
import { HttpException } from '@/exceptions/HttpException';
import { AuthUsers } from '@/models/auth_users.model';
import { boolean } from 'boolean';
import { Device } from '@/interfaces/devices.interface';
import { Devices } from '@/models/devices.model';
import { UserDevice } from '@/interfaces/users_devices.interface';
import { UsersDevices } from '@/models/users_devices.model';
import { phone } from 'phone';
import { SnapSyncErrorType } from '@/utils/enum';

class AuthService {
  public async loginByAuthUser(authUserId: number, device: Device): Promise<LogInResponse> {
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findById(authUserId);
    if (!findAuthUser)
      throw new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    if (!findAuthUser.phoneNumber) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');
    if (!boolean(findAuthUser.isPhoneNumberVerified)) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

    const findUserByPhoneNumber = await Users.query().whereNotDeleted().andWhere('phoneNumber', findAuthUser.phoneNumber).first();
    if (!findUserByPhoneNumber) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    // Controllo se l'utente è stato bannato
    if (boolean(findUserByPhoneNumber.isBanned))
      throw new HttpException(403, 'errors.user_banned', 'Ops! Your account has been banned', undefined, SnapSyncErrorType.HttpNotAuthorizedError);

    const trx = await Users.startTransaction();

    try {
      var findDevice = await Devices.query().whereNotDeleted().findOne({ uuid: device.uuid });
      if (!findDevice) throw new HttpException(404, 'errors.device_not_found', 'Device not found', undefined, SnapSyncErrorType.HttpNotFoundError);

      const td = this.createToken(findUserByPhoneNumber);

      // Controllo se l'utente si è già loggato con questo dispositivo almeno una volta
      const ud: UserDevice = await UsersDevices.query(trx)
        .whereNotDeleted()
        .andWhere('userId', findUserByPhoneNumber.id)
        .andWhere('deviceId', findDevice.id)
        .first();

      if (!ud) {
        // Recupero il conteggio dei dispositivi associati all'utente
        const cUDs = await UsersDevices.query(trx).whereNotDeleted().andWhere('userId', findUserByPhoneNumber.id).resultSize();
        if (cUDs > 5) {
          throw new HttpException(
            400,
            'errors.max_user_devices',
            'Ops! You have reached the maximum number of devices',
            undefined,
            SnapSyncErrorType.SnapSyncMaxUserDevicesError,
          );
        }

        // Se non si è mai loggato con questo dispositivo lo aggiungo
        await UsersDevices.query(trx).insert({
          userId: findUserByPhoneNumber.id,
          deviceId: findDevice.id,
        });
      } else {
        // TODO: Mandare una notifica all'utente che si è loggato con un dispositivo già associato al suo account
      }

      // Elimino l'auth_user
      await AuthUsers.query(trx).deleteById(authUserId);

      // Committo le modifiche
      await trx.commit();

      return {
        tokenData: td,
        deviceUuid: findDevice.uuid,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  public async signUpByAuthUser(authUserId: number, device: Device): Promise<LogInResponse> {
    const findAuthUser = await AuthUsers.query().whereNotDeleted().findById(authUserId);
    if (!findAuthUser) new HttpException(404, 'errors.auth_user_not_found', 'AuthUser not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    // Controllo se tutti i campi sono stati impostati
    if (!findAuthUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');
    if (!findAuthUser.dateOfBirth) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');
    if (!findAuthUser.phoneNumber) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');
    if (!boolean(findAuthUser.isPhoneNumberVerified)) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');
    if (!findAuthUser.username) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

    const phoneNumberResult = phone(findAuthUser.phoneNumber);
    if (!phoneNumberResult.isValid) {
      throw new HttpException(
        422,
        'errors.invalid_phone_number',
        'Phone number is invalid.',
        undefined,
        SnapSyncErrorType.SnapSyncInvalidFormatError,
      );
    }

    // Controllo se esiste già un utente con lo stesso username
    const findUserByUsername = await Users.query().whereNotDeleted().andWhere('username', findAuthUser.username).first();
    if (findUserByUsername) {
      throw new HttpException(
        409,
        'errors.validation.username_already_exists',
        'Username is already taken.',
        undefined,
        SnapSyncErrorType.SnapSyncAlreadyExistsError,
      );
    }

    // Controllo se esiste già un utente con lo stesso numero di telefono
    const findUserByPhoneNumber = await Users.query().whereNotDeleted().andWhere('phoneNumber', findAuthUser.phoneNumber).first();
    if (findUserByPhoneNumber) {
      throw new HttpException(
        409,
        'errors.validation.phone_number_already_exists',
        'Phone number is already taken.',
        undefined,
        SnapSyncErrorType.SnapSyncAlreadyExistsError,
      );
    }

    const trx = await Users.startTransaction();

    // Sarà l'immagine di default
    let firstUsernameChar = findAuthUser.username.charAt(0);
    const key = `letters/${firstUsernameChar.toUpperCase()}.jpeg`;

    const phoneNumberOnlyDigits = phoneNumberResult.phoneNumber.replace(/\D/g, ''); // Rimuovo tutti i caratteri non numerici
    const phoneNumberCountryIso2 = phoneNumberResult.countryIso2;

    try {
      var findDevice = await Devices.query().whereNotDeleted().andWhere('uuid', device.uuid).first();
      if (!findDevice) throw new HttpException(404, 'errors.device_not_found', 'Device not found', undefined, SnapSyncErrorType.HttpNotFoundError);

      // Creo l'utente
      const createdUser = await Users.query(trx).insertAndFetch({
        username: findAuthUser.username,
        phoneNumber: findAuthUser.phoneNumber,
        phoneNumberOnlyDigits: phoneNumberOnlyDigits,
        phoneNumberCountryIso2: phoneNumberCountryIso2,
        dateOfBirth: findAuthUser.dateOfBirth,
        fullName: findAuthUser.fullName,
        profilePicImageKey: key,
      });

      // Ovviamente creo lo user_device
      await UsersDevices.query(trx).insert({
        userId: createdUser.id,
        deviceId: findDevice.id,
      });

      // Elimito l'auth_user
      await AuthUsers.query(trx).deleteById(authUserId);

      // Committo le modifiche
      await trx.commit();

      // Creo il token
      const td = this.createToken(createdUser);

      return {
        tokenData: td,
        deviceUuid: findDevice.uuid,
      };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  public async login(id: number): Promise<TokenData> {
    const user = await Users.query().whereNotDeleted().andWhere('isBanned', false).findById(id);
    if (!user) new HttpException(401, 'errors.invalid_credentials', 'Invalid credentials');

    const tokenData = this.createToken(user);

    return tokenData;
  }

  // public async refreshToken(token: string): Promise<TokenData> {
  //   const secretKey: string = SECRET_KEY;
  //   const verificationResponse = (await verify(token, secretKey)) as DataStoredInToken;
  //   const userId = verificationResponse.id;
  //   const findUser: User = await Users.query().whereNotDeleted().findById(userId);
  //   if (!findUser) new HttpException(401, 'Wrong authentication token');

  //   // Se l'account è stato bannato non faccio refresh del token
  //   if (boolean(findUser.isBanned)) throw new HttpException(403, 'Ops! Your account has been banned');

  //   const tokenData = this.createToken(findUser);

  //   return tokenData;
  // }

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
