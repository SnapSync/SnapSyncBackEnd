import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import AccountsController from '@/controllers/accounts.controller';
import authMiddleware from '@/middlewares/auth.middleware';
import multer from 'multer';
import { SnapSyncException } from '@/exceptions/SnapSyncException';

const storage = multer.memoryStorage({
  destination: './uploads/avatars/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 8, // 8 MB
  },
  fileFilter: function (req, file, cb) {
    // jpg, jpeg, png, bmp, gif
    const allowedMimes = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new SnapSyncException(400, 'Bad Request'), false);
    }
  },
});

class AccountsRoute implements Routes {
  public path = '/accounts';
  public router = Router();
  public accountsController = new AccountsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/edit/web_form_data`, authMiddleware, this.accountsController.getWebFormData);
    this.router.post(`${this.path}/edit`, authMiddleware, this.accountsController.editAccount);
    // this.router.post(`${this.path}/edit/username`, authMiddleware, this.accountsController.changeUsername);
    // this.router.post(`${this.path}/edit/fullname`, authMiddleware, this.accountsController.changeFullName);
    // this.router.post(`${this.path}/edit/biography`, authMiddleware, this.accountsController.changeBiography);

    this.router.post(
      `${this.path}/web_change_profile_pic`,
      authMiddleware,
      upload.single('profilePicture'),
      this.accountsController.changeProfilePicture,
    );
    this.router.post(`${this.path}/web_remove_profile_pic`, authMiddleware, this.accountsController.removeProfilePicture);
  }
}

export default AccountsRoute;
