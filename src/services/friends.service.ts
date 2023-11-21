import { FriendshipStatus } from '@/interfaces/friendship.interface';
import { Users } from '@/models/users.model';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { BlockedUsers } from '@/models/blocked_users.model';
import { generateFriendshipHash } from '@/utils/util';
import { Friends } from '@/models/friends.model';
import { StatusEnum } from '@/utils/enum';

class FriendService {
  public async getFriendshipStatus(userId: number, loggedUserId: number): Promise<FriendshipStatus> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findLoggedUser = await Users.query().whereNotDeleted().findById(loggedUserId);
    if (!findLoggedUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo che findUser non abbiano bloccato findLoggedUser
    const isBlocked = await BlockedUsers.query()
      .whereNotDeleted()
      .andWhere('userId', findUser.id)
      .andWhere('blockedUserId', findLoggedUser.id)
      .first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    let fs: FriendshipStatus = {
      isFriend: false,

      incomingRequest: false,
      outgoingRequest: false,

      isBlocking: false,
    };

    // Controllo se loggedUser ha bloccato findUser
    const isBlocking = await BlockedUsers.query()
      .whereNotDeleted()
      .andWhere('userId', findLoggedUser.id)
      .andWhere('blockedUserId', findUser.id)
      .first();

    fs.isBlocking = isBlocking ? true : false;

    if (!isBlocking) {
      // Controllo se sono amici
      let areFriends = await this.areFriends(userId, loggedUserId);

      fs.isFriend = areFriends;

      if (!areFriends) {
        // Controllo se esiste una richiesta in entrata
        let fh = generateFriendshipHash(userId, loggedUserId);

        const incomingRequest = await Friends.query()
          .whereNotDeleted()
          .andWhere('status', StatusEnum.pending)
          .andWhere('friendshipHash', fh)
          .andWhere('friendId', loggedUserId)
          .andWhere('userId', userId)
          .first();
        if (incomingRequest) fs.incomingRequest = true;
        else {
          // Controllo se esiste una richiesta in uscita
          const outgoingRequest = await Friends.query()
            .whereNotDeleted()
            .andWhere('status', StatusEnum.pending)
            .andWhere('friendshipHash', fh)
            .andWhere('friendId', userId)
            .andWhere('userId', loggedUserId)
            .first();
          if (outgoingRequest) fs.outgoingRequest = true;
        }
      }
    }

    return fs;
  }

  public async createFriendship(userId: number, friendId: number): Promise<void> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findFriend = await Users.query().whereNotDeleted().findById(friendId);
    if (!findFriend) throw new SnapSyncException(404, 'Not Found');

    if (findUser.id === findFriend.id) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che findUser non abbiano bloccato findFriend
    const isBlocked = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findUser.id).andWhere('blockedUserId', findFriend.id).first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    const isBlocking = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findFriend.id).andWhere('blockedUserId', findUser.id).first();
    if (isBlocking) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se sono amici
    let areFriends = await this.areFriends(userId, friendId);
    if (areFriends) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se esiste una richiesta in entrata
    let fh = generateFriendshipHash(userId, friendId);

    const incomingRequest = await Friends.query()
      .whereNotDeleted()
      .andWhere('status', StatusEnum.pending)
      .andWhere('friendshipHash', fh)
      .andWhere('friendId', friendId)
      .andWhere('userId', userId)
      .first();
    if (incomingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se esiste una richiesta in uscita
    const outgoingRequest = await Friends.query()
      .whereNotDeleted()
      .andWhere('status', StatusEnum.pending)
      .andWhere('friendshipHash', fh)
      .andWhere('friendId', userId)
      .andWhere('userId', friendId)
      .first();
    if (outgoingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Creo la richiesta
    await Friends.query().insert({
      userId: userId,
      friendId: friendId,
      status: 'pending',
    });
  }

  public async acceptFriendship(userId: number, friendId: number): Promise<void> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findFriend = await Users.query().whereNotDeleted().findById(friendId);
    if (!findFriend) throw new SnapSyncException(404, 'Not Found');

    if (findUser.id === findFriend.id) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che findUser non abbiano bloccato findFriend
    const isBlocked = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findUser.id).andWhere('blockedUserId', findFriend.id).first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    const isBlocking = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findFriend.id).andWhere('blockedUserId', findUser.id).first();
    if (isBlocking) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se sono amici
    let areFriends = await this.areFriends(userId, friendId);
    if (areFriends) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se esiste una richiesta pendente per findFriend fatta da findUser
    let fh = generateFriendshipHash(userId, friendId);

    const incomingRequest = await Friends.query()
      .whereNotDeleted()
      .andWhere('status', StatusEnum.pending)
      .andWhere('friendshipHash', fh)
      .andWhere('friendId', friendId)
      .andWhere('userId', userId)
      .first();
    if (!incomingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Accetto la richiesta
    await Friends.query().patchAndFetchById(incomingRequest.id, {
      acceptedAt: new Date(),
      status: 'accepted',
    });
  }

  public async rejectFriendship(userId: number, friendId: number): Promise<void> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findFriend = await Users.query().whereNotDeleted().findById(friendId);
    if (!findFriend) throw new SnapSyncException(404, 'Not Found');

    if (findUser.id === findFriend.id) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che findUser non abbiano bloccato findFriend
    const isBlocked = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findUser.id).andWhere('blockedUserId', findFriend.id).first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    const isBlocking = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findFriend.id).andWhere('blockedUserId', findUser.id).first();
    if (isBlocking) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se sono amici
    let areFriends = await this.areFriends(userId, friendId);
    if (areFriends) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se esiste una richiesta pendente per findFriend fatta da findUser
    let fh = generateFriendshipHash(userId, friendId);

    const incomingRequest = await Friends.query()
      .whereNotDeleted()
      .andWhere('status', StatusEnum.pending)
      .andWhere('friendshipHash', fh)
      .andWhere('friendId', friendId)
      .andWhere('userId', userId)
      .first();
    if (!incomingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Rifiuto la richiesta
    await Friends.query().patchAndFetchById(incomingRequest.id, {
      rejectedAt: new Date(),
      status: 'rejected',
    });

    // Elimino la richiesta tanto non è più necessaria
    await Friends.query().deleteById(incomingRequest.id);
  }

  public async areFriends(userId: number, loggedUserId: number): Promise<boolean> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findLoggedUser = await Users.query().whereNotDeleted().findById(loggedUserId);
    if (!findLoggedUser) throw new SnapSyncException(404, 'Not Found');

    // Controllo che findUser non abbiano bloccato findLoggedUser
    const isBlocked = await BlockedUsers.query()
      .whereNotDeleted()
      .andWhere('userId', findUser.id)
      .andWhere('blockedUserId', findLoggedUser.id)
      .first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    // Controllo se sono amici
    let fh = generateFriendshipHash(userId, loggedUserId);

    const friend = await Friends.query().whereNotDeleted().andWhere('status', StatusEnum.accepted).andWhere('friendshipHash', fh).first();
    if (friend) return true;

    return false;
  }

  // public async findFriendsCountByUserId(userId: number, loggedUserId: number, query?: string): Promise<number> {
  //   const fnName = 'Fn_GetFriendsCount';
  //   var friendsCount = 0;
  //   try {
  //     const prmQuery = query && query.length > 0 ? query : null;
  //     await knex
  //       .raw(
  //         `
  //               SELECT ${fnName}(${userId}, ${loggedUserId}, ${prmQuery}}) AS count;
  //           `,
  //       )
  //       .then(result => {
  //         if (
  //           result &&
  //           Array.isArray(result) &&
  //           result.length > 0 &&
  //           Array.isArray(result[0]) &&
  //           result[0].length > 0 &&
  //           result[0][0].count !== undefined
  //         ) {
  //           friendsCount = result[0][0].count;
  //         }
  //       })
  //       .catch(error => {
  //         throw new SqlException(error);
  //       });
  //   } catch (error) {
  //     throw error;
  //   }
  //   return friendsCount;
  // }
  // public async findFriendsByUserId(
  //   userId: number,
  //   loggedUserId: number,
  //   query?: string,
  //   limit?: number,
  //   offset?: number,
  // ): Promise<{
  //   users: ApiUser[];
  //   pagination: RoutePagination;
  // }> {
  //   const spName = 'Sp_GetFriends';
  //   var users: ApiUser[] = [];
  //   var pagination: RoutePagination = {
  //     total: 0,
  //     page: 0,
  //     size: 0,
  //     hasMore: false,
  //   };
  //   try {
  //     const prmQuery = query && query.length > 0 ? query : null;
  //     const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
  //     const prmOffset = offset !== undefined && offset > 0 ? offset : 0;
  //     const queryToExecute = `
  //               CALL ${spName}(${userId}, ${loggedUserId}, ${prmQuery}, ${prmLimit}, ${prmOffset});
  //           `;
  //     await knex
  //       .raw(queryToExecute)
  //       .then(async result => {
  //         if (
  //           result &&
  //           Array.isArray(result) &&
  //           result.length > 0 &&
  //           Array.isArray(result[0]) &&
  //           result[0].length > 0 &&
  //           Array.isArray(result[0][0]) &&
  //           result[0][0].length > 0
  //         ) {
  //           let rUsers = result[0][0];
  //           const total = rUsers[0].total;
  //           pagination.hasMore = total > prmOffset + prmLimit;
  //           pagination.page = Math.floor(prmOffset / prmLimit) + 1;
  //           pagination.size = prmLimit;
  //           pagination.total = total;
  //           for (let i = 0; i < rUsers.length; i++) {
  //             let us = await new UserService().findApiUserById(rUsers[i].userId);
  //             users.push(us);
  //           }
  //         }
  //       })
  //       .catch(error => {
  //         throw new SqlException(error);
  //       });
  //   } catch (error) {
  //     throw error;
  //   }
  //   return {
  //     users,
  //     pagination,
  //   };
  // }
  // public async findMutualFriendsCountByUserId(userId: number, loggedUserId: number, query?: string): Promise<number> {
  //   const fnName = 'Fn_GetMutualFriendsCount';
  //   var mutualFriendsCount = 0;
  //   try {
  //     const prmQuery = query && query.length > 0 ? query : null;
  //     await knex
  //       .raw(
  //         `
  //               SELECT ${fnName}(${userId}, ${loggedUserId}, ${prmQuery}) AS count;
  //           `,
  //       )
  //       .then(result => {
  //         if (
  //           result &&
  //           Array.isArray(result) &&
  //           result.length > 0 &&
  //           Array.isArray(result[0]) &&
  //           result[0].length > 0 &&
  //           result[0][0].count !== undefined
  //         ) {
  //           mutualFriendsCount = result[0][0].count;
  //         }
  //       })
  //       .catch(error => {
  //         throw new SqlException(error);
  //       });
  //   } catch (error) {
  //     throw error;
  //   }
  //   return mutualFriendsCount;
  // }
  // public async findMutualFriendsByUserId(
  //   userId: number,
  //   loggedUserId: number,
  //   query?: string,
  //   limit?: number,
  //   offset?: number,
  // ): Promise<{
  //   users: ApiUser[];
  //   pagination: RoutePagination;
  // }> {
  //   const spName = 'Sp_GetMutualFriends';
  //   var users: ApiUser[] = [];
  //   var pagination: RoutePagination = {
  //     total: 0,
  //     page: 0,
  //     size: 0,
  //     hasMore: false,
  //   };
  //   try {
  //       const prmQuery = query && query.length > 0 ? query : null;
  //       const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
  //       const prmOffset = offset !== undefined && offset > 0 ? offset : 0;
  //       const queryToExecute = `
  //               CALL ${spName}(${userId}, ${loggedUserId}, ${prmQuery}, ${prmLimit}, ${prmOffset});
  //           `;
  //       await knex.raw(queryToExecute).then(async result => {
  //           if (
  //               result &&
  //               Array.isArray(result) &&
  //               result.length > 0 &&
  //               Array.isArray(result[0]) &&
  //               result[0].length > 0 &&
  //               Array.isArray(result[0][0]) &&
  //               result[0][0].length > 0
  //           ) {
  //               let rUsers = result[0][0];
  //               const total = rUsers[0].total;
  //               pagination.hasMore = total > prmOffset + prmLimit;
  //               pagination.page = Math.floor(prmOffset / prmLimit) + 1;
  //               pagination.size = prmLimit;
  //               pagination.total = total;
  //               for (let i = 0; i < rUsers.length; i++) {
  //                   let us = await new UserService().findApiUserById(rUsers[i].userId);
  //                   users.push(us);
  //               }
  //           }
  //       }).catch(error => {
  //           throw new SqlException(error);
  //       })
  //   } catch (error) {
  //       throw error;
  //       }
  //   return {
  //     users,
  //     pagination,
  //   };
  // }
}

export default FriendService;
