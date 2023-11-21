import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { BlockedUsers } from '@/models/blocked_users.model';
import { Users } from '@/models/users.model';

class BlockedUserService {
  public async isBlockedByUser(userId: number, blockedUserId: number): Promise<boolean> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findBlockedUser = await Users.query().whereNotDeleted().findById(blockedUserId);
    if (!findBlockedUser) throw new SnapSyncException(404, 'Not Found');

    const findBU = await BlockedUsers.query().whereNotDeleted().andWhere('userId', userId).andWhere('blockedUserId', blockedUserId).first();

    if (findBU) return true;
    else return false;
  }
}

export default BlockedUserService;
