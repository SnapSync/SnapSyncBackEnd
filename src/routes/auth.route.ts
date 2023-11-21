import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';

class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/get_session_id`, this.authController.getSessionId);

    this.router.post(`${this.path}/fullname`, this.authController.authFlowFullName);
    this.router.post(`${this.path}/date_of_birth`, this.authController.authFlowDateOfBirth);
    this.router.post(`${this.path}/phone_number`, this.authController.authFlowPhoneNumber);
    this.router.post(`${this.path}/otp`, this.authController.authFlowOtp);
    this.router.post(`${this.path}/resend_otp`, this.authController.authFlowResendOtp);
    this.router.post(`${this.path}/username`, this.authController.authFlowUsername);

    this.router.post(`${this.path}/signup`, this.authController.signUp);

    this.router.post(`${this.path}/auth_token/exchange`, this.authController.authTokenExchange);
    this.router.post(`${this.path}/refresh_token`, this.authController.refreshToken);

    this.router.post(`${this.path}/login/:userId`, this.authController.login);
  }
}

export default AuthRoute;
