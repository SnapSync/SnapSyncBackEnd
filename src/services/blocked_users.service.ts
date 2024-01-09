import { CreateBlockedUserDto } from '@/dtos/blocked_users.dto';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { BlockedUser } from '@/interfaces/blocked_users.interface';
import { ApiUser } from '@/interfaces/users.interface';
import { BlockedUsers } from '@/models/blocked_users.model';
import { Friends } from '@/models/friends.model';
import { Users } from '@/models/users.model';
import { generateFriendshipHash, isEmpty } from '@/utils/util';
import UserService from './users.service';

class BlockedUserService {
  public async findBlockedUsersByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<{
    data: ApiUser[];
    total: number;
  }> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const data = await BlockedUsers.query().whereNotDeleted().andWhere('userId', userId).limit(limit).offset(offset);
    const total = await BlockedUsers.query().whereNotDeleted().andWhere('userId', userId).resultSize();

    let users: ApiUser[] = [];

    for (let i = 0; i < data.length; i++) {
      let apiUser = await new UserService().findApiUserById(data[i].blockedUserId);
      users.push(apiUser);
    }

    return { data: users, total: total };
  }

  public async findBlockedUsersCountByUserId(userId: number): Promise<number> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const total = await BlockedUsers.query().whereNotDeleted().andWhere('userId', userId).resultSize();

    return total;
  }

  public async blockUser(data: CreateBlockedUserDto): Promise<BlockedUser> {
    if (isEmpty(data)) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che data.userId esista
    const findUser = await Users.query().whereNotDeleted().findById(data.userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo che data.blockedUserId esista
    const findBlockedUser = await Users.query().whereNotDeleted().findById(data.blockedUserId);
    if (!findBlockedUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo che data.userId non abbia già bloccato data.blockedUserId
    const findBU = await BlockedUsers.query().whereNotDeleted().andWhere('userId', data.userId).andWhere('blockedUserId', data.blockedUserId).first();
    if (findBU) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che data.blockedUserId non abbia già bloccato data.userId
    const findBU2 = await BlockedUsers.query()
      .whereNotDeleted()
      .andWhere('userId', data.blockedUserId)
      .andWhere('blockedUserId', data.userId)
      .first();
    if (findBU2) throw new SnapSyncException(404, 'Not Found');

    const trx = await BlockedUsers.startTransaction();

    try {
      const createBU: BlockedUser = await BlockedUsers.query(trx).insertAndFetch(data);

      // Cancello tutte le richieste di amicizia tra data.userId e data.blockedUserId
      const friendshipHash = generateFriendshipHash(data.userId, data.blockedUserId);

      await Friends.query(trx).delete().where('friendshipHash', friendshipHash);

      await trx.commit();

      return createBU;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  public async unblockUser(userId: number, blockedUserId: number): Promise<void> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findBlockedUser = await Users.query().whereNotDeleted().findById(blockedUserId);
    if (!findBlockedUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo che blockedUserId non abbia blocckato userId
    const findBU = await BlockedUsers.query().whereNotDeleted().andWhere('userId', blockedUserId).andWhere('blockedUserId', userId).first();
    if (findBU) throw new SnapSyncException(404, 'Not Found');

    // Controllo che effettivamente esista un blocco tra userId e blockedUserId
    const findBU2 = await BlockedUsers.query().whereNotDeleted().andWhere('userId', userId).andWhere('blockedUserId', blockedUserId).first();
    if (!findBU2) throw new SnapSyncException(404, 'Not Found');

    await BlockedUsers.query().deleteById(findBU2.id);
  }

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
