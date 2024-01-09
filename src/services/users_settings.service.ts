import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { UserSetting } from '@/interfaces/users_settings.interface';
import { Users } from '@/models/users.model';
import { UsersSettings } from '@/models/users_settings.model';

class UserSettingService {
  public async findUserSettingsByUserId(userId: number): Promise<UserSetting> {
    const findOne = await UsersSettings.query().where('userId', userId).first();
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    return findOne;
  }

  public async updateAllowSyncContacts(userId: number, allowSyncContacts: boolean): Promise<UserSetting> {
    const findOne = await Users.query().whereNotDeleted().where('id', userId).first();
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const userSetting = await UsersSettings.query().where('userId', userId).first();
    if (!userSetting) throw new SnapSyncException(404, 'Not Found');

    const updatedUserSetting = await UsersSettings.query().patchAndFetchById(userSetting.id, {
      allowSyncContacts: allowSyncContacts,
    });

    return updatedUserSetting;
  }
}

export default UserSettingService;
