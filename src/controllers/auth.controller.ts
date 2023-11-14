import { NextFunction, Request, Response } from 'express';
import AuthService from '@services/auth.service';
import * as yup from 'yup';
import AuthUserService from '@/services/auth_users.service';
import {
  FULLNAME_REGEX,
  MAX_FULLNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_FULLNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_REGEX,
} from '@/services/validation.service';
import { HttpException } from '@/exceptions/HttpException';
import TwilioService from '@/services/twilio.service';
import { boolean } from 'boolean';
import UserService from '@/services/users.service';
import { RequestWithDevice } from '@/interfaces/auth.interface';
import { CreateAuthUserDto } from '@/dtos/auth_users.dto';

class AuthController {
  public authService = new AuthService();
  public authUserService = new AuthUserService();
  public twilioService = new TwilioService();
  public userService = new UserService();

  public getSessionId = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    try {
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      const data: CreateAuthUserDto = {
        deviceId: req.device.id,
      };

      const authUser = await this.authUserService.createAuthUser(data);

      res.status(200).json({ sessionId: authUser.sessionId, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowFullName = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(
        req.t('errors.validation.required', {
          field: 'SessionId',
        }),
      ),
      fullname: yup
        .string()
        .required(
          req.t('errors.validation.required', {
            field: req.t('fields.fullname'),
          }),
        )
        .min(
          MIN_FULLNAME_LENGTH,
          req.t('errors.validation.minLenght', {
            field: req.t('fields.fullname'),
            min: MIN_FULLNAME_LENGTH,
          }),
        )
        .max(MAX_FULLNAME_LENGTH, req.t('errors.validation.maxLenght', { field: req.t('fields.fullname'), max: MAX_FULLNAME_LENGTH }))
        .matches(FULLNAME_REGEX, req.t('errors.validation.regex', { field: req.t('fields.fullname') })),
    });

    try {
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      // Se lo username è già stato impostato, allora non può cambiare il fullname
      if (authUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      await this.authUserService.updateAuthUserFullName(authUser.id, req.body.fullname);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowDateOfBirth = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(req.t('errors.validation.required', { field: 'SessionId' })),
      yearOfBirth: yup
        .number()
        .required(
          req.t('errors.validation.required', {
            field: req.t('fields.yearOfBirth'),
          }),
        )
        .min(
          1900,
          req.t('errors.validation.min', {
            field: req.t('fields.yearOfBirth'),
            min: 1900,
          }),
        )
        .max(
          new Date().getFullYear(),
          req.t('errors.validation.max', {
            field: req.t('fields.yearOfBirth'),
            max: new Date().getFullYear(),
          }),
        ),
      monthOfBirth: yup
        .number()
        .required()
        .min(
          1,
          req.t('errors.validation.min', {
            field: req.t('fields.monthOfBirth'),
            min: 1,
          }),
        )
        .max(12, req.t('errors.validation.max', { field: req.t('fields.monthOfBirth'), max: 12 })),
      dayOfBirth: yup
        .number()
        .required()
        .min(1, req.t('errors.validation.min', { field: req.t('fields.dayOfBirth'), min: 1 }))
        .max(31, req.t('errors.validation.max', { field: req.t('fields.dayOfBirth'), max: 31 })),
    });

    try {
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      if (!authUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');
      if (authUser.dateOfBirth) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      const { yearOfBirth, monthOfBirth, dayOfBirth } = req.body;

      await this.authUserService.updateAuthUserDateOfBirth(authUser.id, yearOfBirth, monthOfBirth, dayOfBirth);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowPhoneNumber = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(
        req.t('errors.validation.required', {
          field: 'SessionId',
        }),
      ),
      phoneNumber: yup.string().required(
        req.t('errors.validation.required', {
          field: req.t('fields.phoneNumber'),
        }),
      ),
    });

    try {
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      if (!authUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il primo step
      if (!authUser.dateOfBirth) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il secondo step
      // if (authUser.phoneNumber) throw new HttpException(400, 'Phone number already set'); // L'utente può cambiare il numero di telefono

      const au = await this.authUserService.updateAuthUserPhoneNumber(authUser.id, req.body.phoneNumber);

      // Se va a buon fine, invio OTP al numero di telefono
      // this.twilioService.sendOtp(au.phoneNumber);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowOtp = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(
        req.t('errors.validation.required', {
          field: 'SessionId',
        }),
      ),
      otp: yup.string().required(
        req.t('errors.validation.required', {
          field: 'OTP',
        }),
      ),
    });

    try {
      // Per poter fare il login/signup devo avere il device
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      if (!authUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il primo step
      if (!authUser.dateOfBirth) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il secondo step
      if (!authUser.phoneNumber) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il terzo step
      if (boolean(authUser.isPhoneNumberVerified)) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che ha già completato questo step

      // const isValid = await this.twilioService.verifyOtp(authUser.phoneNumber, req.body.otp);
      // if (!isValid) throw new HttpException(401, 'errors.invalid_otp', 'Invalid OTP', undefined, SnapSyncErrorType.HttpNotAuthorizedError);

      await this.authUserService.updateAuthUserPhoneNumberVerified(authUser.id, true);

      // Controllo se l'utente esiste già: se si allora faccio login, altrimenti lo mando alla prossima schermata
      var exists = false;
      try {
        await this.userService.findUserByPhoneNumber(authUser.phoneNumber);
        exists = true;
      } catch (error) {
        if (error instanceof HttpException && error.status === 404) {
          exists = false;
        } else {
          throw error;
        }
      }

      var response = {};
      if (exists) {
        response['goNext'] = false;

        const d = await this.authService.loginByAuthUser(authUser.id, req.device);
        response['data'] = d;
      } else {
        response['goNext'] = true;
      }

      res.status(200).json({ ...response });
    } catch (error) {
      next(error);
    }
  };

  public authFlowUsername = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(
        req.t('errors.validation.required', {
          field: 'SessionId',
        }),
      ),
      username: yup
        .string()
        .required(
          req.t('errors.validation.required', {
            field: req.t('fields.username'),
          }),
        )
        .min(MIN_USERNAME_LENGTH, req.t('errors.validation.minLenght', { field: req.t('fields.username'), min: MIN_USERNAME_LENGTH }))
        .max(MAX_USERNAME_LENGTH, req.t('errors.validation.maxLenght', { field: req.t('fields.username'), max: MAX_USERNAME_LENGTH }))
        .matches(USERNAME_REGEX, req.t('errors.validation.regex', { field: req.t('fields.username') })),
    });

    try {
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      if (!authUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il primo step
      if (!authUser.dateOfBirth) new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il secondo step
      if (!authUser.phoneNumber) new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il terzo step
      if (!boolean(authUser.isPhoneNumberVerified)) new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il quarto step
      if (authUser.username) new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che ha già completato questo step

      await this.authUserService.updateAuthUserUsername(authUser.id, req.body.username);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowResendOtp = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(req.t('errors.validation.required', { field: 'SessionId' })),
    });

    try {
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      if (!authUser.phoneNumber) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il terzo step
      if (boolean(authUser.isPhoneNumberVerified)) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che ha già completato questo step

      // await this.twilioService.sendOtp(authUser.phoneNumber);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public signUp = async (req: RequestWithDevice, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(
        req.t('errors.validation.required', {
          field: 'SessionId',
        }),
      ),
    });

    try {
      // Per poter fare il login/signup devo avere il device
      if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Controllo se l'AuthUser è legato a questo device
      if (authUser.deviceId !== req.device.id) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong');

      if (!authUser.fullName) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il primo step
      if (!authUser.dateOfBirth) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il secondo step
      if (!authUser.phoneNumber) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il terzo step
      if (!boolean(authUser.isPhoneNumberVerified)) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il quarto step
      if (!authUser.username) throw new HttpException(400, 'errors.something_went_wrong', 'Ops! Something went wrong'); // Significa che non ha completato il quinto step

      const d = await this.authService.signUpByAuthUser(authUser.id, req.device);

      res.status(201).json({ data: d, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.params.userId) throw new HttpException(400, 'errors.invalid_query_params', 'Invalid query params');
      if (isNaN(parseInt(req.params.userId))) throw new HttpException(400, 'errors.invalid_query_params', 'Invalid query params');

      const userId = parseInt(req.params.userId);

      // TODO: Da rimuovere in produzione
      const t = await this.authService.login(userId);

      res.status(200).json({ data: t, message: req.t('success.Ok') });
    } catch (error) {
      next(error);
    }
  };

  // public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  //   const validationSchema = yup.object().shape({
  //     token: yup.string().required(),
  //   });

  //   try {
  //     await validationSchema.validate(req.body, { abortEarly: false });

  //     const token: string = req.body.token;
  //     const r = await this.authService.refreshToken(token);

  //     res.status(200).json({ data: r, message: 'ok' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}

export default AuthController;
