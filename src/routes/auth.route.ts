import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import deviceMiddleware from '@/middlewares/device.middleware';

class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/get_session_id`, deviceMiddleware, this.authController.getSessionId);

    this.router.post(`${this.path}/fullname`, deviceMiddleware, this.authController.authFlowFullName);
    this.router.post(`${this.path}/date_of_birth`, deviceMiddleware, this.authController.authFlowDateOfBirth);
    this.router.post(`${this.path}/phone_number`, deviceMiddleware, this.authController.authFlowPhoneNumber);
    this.router.post(`${this.path}/otp`, deviceMiddleware, this.authController.authFlowOtp);
    this.router.post(`${this.path}/resend_otp`, deviceMiddleware, this.authController.authFlowResendOtp);
    this.router.post(`${this.path}/username`, deviceMiddleware, this.authController.authFlowUsername);

    this.router.post(`${this.path}/signup`, deviceMiddleware, this.authController.signUp);

    this.router.post(`${this.path}/login/:userId`, this.authController.login);

    // // this.router.post(`${this.path}/signup`, this.authController.signUp);
    // this.router.post(`${this.path}/refresh_token`, this.authController.refreshToken);
  }
}

export default AuthRoute;
