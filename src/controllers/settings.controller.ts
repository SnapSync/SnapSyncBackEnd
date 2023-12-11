import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { User } from '@/interfaces/users.interface';
import { UserSetting } from '@/interfaces/users_settings.interface';
import BlockedUserService from '@/services/blocked_users.service';
import UserSettingService from '@/services/users_settings.service';
import { retrivePaginationParamFromRequest } from '@/utils/util';
import { boolean } from 'boolean';
import { NextFunction, Response } from 'express';
import * as yup from 'yup';

class SettingsController {
  public blockedUserService = new BlockedUserService();
  public userSettingService = new UserSettingService();

  public getWebInfo = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new SnapSyncException(401, 'Unauthorized');

      const userSetting = await this.userSettingService.findUserSettingsByUserId(req.user.id);

      let webInfo = this.generateWebInfo(req.user, userSetting);

      res.status(200).json({
        webInfo: webInfo,
        message: 'ok',
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserBlockedUsers = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      let p = retrivePaginationParamFromRequest(req);

      // Calcolo il limit e l'offset
      const limit = p.size;
      const offset = (p.page - 1) * p.size;

      const data = await this.blockedUserService.findBlockedUsersByUserId(req.user.id, limit, offset);

      // Calcolo il nextCursor/prevCursor per React-Query
      const allPages = Math.ceil(data.total / limit);
      const nextCursor: number | undefined = allPages > p.page ? p.page + 1 : undefined;
      const prevCursor: number | undefined = p.page > 1 ? p.page - 1 : undefined;

      res.status(200).json({
        message: 'ok',
        data: data.data,
        nextCursor: nextCursor,
        prevCursor: prevCursor,
        total: data.total,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateAllowSyncContacts = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      allowSyncContacts: yup.boolean().required(),
    });

    try {
      if (!req.user) throw new SnapSyncException(401, 'Unauthorized');

      await validationSchema.validate(req.body, { abortEarly: false });

      const allowSyncContacts = boolean(req.body.allowSyncContacts);

      const userSetting = await this.userSettingService.updateAllowSyncContacts(req.user.id, allowSyncContacts);

      const webInfo = this.generateWebInfo(req.user, userSetting);

      res.status(200).json({
        webInfo: webInfo,
        message: 'ok',
      });
    } catch (error) {
      next(error);
    }
  };

  private generateWebInfo = (
    user: User,
    userSetting: UserSetting,
  ): {
    isPrivate: boolean;
    allowSyncContacts: boolean;
  } => {
    return {
      isPrivate: boolean(user.isPrivate),
      allowSyncContacts: boolean(userSetting.allowSyncContacts),
    };
  };
}

export default SettingsController;
