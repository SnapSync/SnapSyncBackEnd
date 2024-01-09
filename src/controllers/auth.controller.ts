import { NextFunction, Request, Response } from 'express';
import AuthService from '@services/auth.service';
import * as yup from 'yup';
import AuthUserService from '@/services/auth_users.service';
import { FULLNAME_REGEX, MAX_FULLNAME_LENGTH, MAX_USERNAME_LENGTH, MIN_FULLNAME_LENGTH, MIN_USERNAME_LENGTH, USERNAME_REGEX } from '@/utils/costants';
import TwilioService from '@/services/twilio.service';
import { boolean } from 'boolean';
import UserService from '@/services/users.service';
import { CreateAuthUserDto } from '@/dtos/auth_users.dto';
import { SnapSyncException } from '@/exceptions/SnapSyncException';

class AuthController {
  public authService = new AuthService();
  public authUserService = new AuthUserService();
  public twilioService = new TwilioService();
  public userService = new UserService();

  public getSessionId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateAuthUserDto = {};

      const authUser = await this.authUserService.createAuthUser(data);

      res.status(201).json({ sessionId: authUser.sessionId, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowFullName = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(),
      fullname: yup.string().required().min(MIN_FULLNAME_LENGTH).max(MAX_FULLNAME_LENGTH).matches(FULLNAME_REGEX),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      // Se lo username è già stato impostato, allora non può cambiare il fullname
      if (authUser.fullname) throw new SnapSyncException(400, 'Bad Request');

      await this.authUserService.updateAuthUserFullName(authUser.id, req.body.fullname);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowDateOfBirth = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(req.t('errors.validation.required', { field: 'SessionId' })),
      yearOfBirth: yup.number().required().min(1900).max(new Date().getFullYear()),
      monthOfBirth: yup.number().required().min(1).max(12),
      dayOfBirth: yup.number().required().min(1).max(31),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      if (!authUser.fullname) throw new SnapSyncException(400, 'Bad Request');
      if (authUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');

      const { yearOfBirth, monthOfBirth, dayOfBirth } = req.body;

      await this.authUserService.updateAuthUserDateOfBirth(authUser.id, yearOfBirth, monthOfBirth, dayOfBirth);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowPhoneNumber = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(),
      phoneNumber: yup.string().required(),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      if (!authUser.fullname) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');
      // if (authUser.phoneNumber) throw new HttpException(400, 'Phone number already set'); // L'utente può cambiare il numero di telefono

      const au = await this.authUserService.updateAuthUserPhoneNumber(authUser.id, req.body.phoneNumber);

      // Se va a buon fine, invio OTP al numero di telefono
      // this.twilioService.sendOtp(au.phoneNumber);

      // Aggiorno il campo otpSendedAt
      await this.authUserService.updateAuthUserOtpSendedAt(au.id, new Date());

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowOtp = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(),
      otp: yup.string().required(),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      if (!authUser.fullname) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
      if (boolean(authUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');

      // TODO: Da rimuovere in produzione
      const isValid = req.body.otp === '123456' ? true : false;
      // const isValid = await this.twilioService.verifyOtp(authUser.phoneNumber, req.body.otp);
      if (!isValid) throw new SnapSyncException(401, 'Unauthorized');

      await this.authUserService.updateAuthUserPhoneNumberVerified(authUser.id, true);

      // Controllo se l'utente esiste già: se si allora faccio login, altrimenti lo mando alla prossima schermata
      var exists = false;
      try {
        const u = await this.userService.findUserByPhoneNumber(authUser.phoneNumber);
        if (u) exists = true;
      } catch (error) {
        if (error instanceof SnapSyncException && error.status === 404) {
          exists = false;
        } else {
          throw error;
        }
      }

      var response = {};
      if (exists) {
        response['goNext'] = false;

        const d = await this.authService.loginByAuthUser(authUser.id);
        response['data'] = d;
      } else {
        response['goNext'] = true;
      }

      response['message'] = 'ok';

      res.status(200).json({ ...response });
    } catch (error) {
      next(error);
    }
  };

  public authFlowResendOtp = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      if (!authUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
      if (boolean(authUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');

      // Verifico se è passato un minuto dall'ultimo invio
      const now = new Date();
      const otpSendedAt: Date | null = authUser.otpSendedAt;

      if (otpSendedAt) {
        // Se è passato un minuto, allora posso inviare un nuovo OTP
        const diff = now.getTime() - otpSendedAt.getTime();
        const minutes = Math.floor(diff / 1000 / 60);

        if (minutes < 1) throw new SnapSyncException(400, 'Bad Request');
      }

      // Invio un nuovo OTP
      // await this.twilioService.sendOtp(authUser.phoneNumber);

      // Aggiorno il campo otpSendedAt
      await this.authUserService.updateAuthUserOtpSendedAt(authUser.id, now);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public authFlowUsername = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(),
      username: yup.string().required().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH).matches(USERNAME_REGEX),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      if (!authUser.fullname) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
      if (!boolean(authUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');
      // if (authUser.username) throw new SnapSyncException(400, 'Bad Request');

      // const { username } = req.body;

      // const trimmedUsername = username.trim().toLocaleLowerCase();

      await this.authUserService.validateAuthUserUsername(authUser.id, req.body.username);

      res.status(200).json({ message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      sessionId: yup.string().required(),
      username: yup.string().required().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH).matches(USERNAME_REGEX),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const authUser = await this.authUserService.findAuthUserBySessionId(req.body.sessionId);

      if (!authUser.fullname) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.dateOfBirth) throw new SnapSyncException(400, 'Bad Request');
      if (!authUser.phoneNumber) throw new SnapSyncException(400, 'Bad Request');
      if (!boolean(authUser.isPhoneNumberVerified)) throw new SnapSyncException(400, 'Bad Request');
      // if (!authUser.username) throw new SnapSyncException(400, 'Bad Request');

      const d = await this.authService.signUpByAuthUser(authUser.id, req.body.username);

      res.status(201).json({ data: d, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // if (!req.params.userId) throw new SnapSyncException(400, 'Bad Request');
      // if (isNaN(parseInt(req.params.userId))) throw new SnapSyncException(400, 'Bad Request');

      const userId = req.body.userId;
      if (!userId) throw new SnapSyncException(400, 'Bad Request');
      if (isNaN(parseInt(userId))) throw new SnapSyncException(400, 'Bad Request');

      // TODO: Da rimuovere in produzione
      const t = await this.authService.login(userId);

      res.status(200).json({ message: 'ok', result: t });
    } catch (error) {
      next(error);
    }
  };

  public authTokenExchange = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      authToken: yup.string().required(),
    });

    try {
      // if (!req.device || req.device === null) throw new HttpException(400, 'errors.device_not_set', 'Ops! Device is not set');

      await validationSchema.validate(req.body, { abortEarly: false });

      const { authToken } = req.body;

      const d = await this.authService.loginByAuthToken(authToken);

      res.status(200).json({ result: d, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      token: yup.string().required(),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const token: string = req.body.token;
      const r = await this.authService.refreshToken(token);

      res.status(200).json({ data: r, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
