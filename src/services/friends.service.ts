import { FriendshipStatus } from '@/interfaces/friendship.interface';
import { Users } from '@/models/users.model';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { BlockedUsers } from '@/models/blocked_users.model';
import { generateFriendshipHash } from '@/utils/util';
import { Friends } from '@/models/friends.model';
import { StatusEnum } from '@/utils/enum';
import knex from '@databases';
import { SqlException } from '@/exceptions/SqlException';
import { ApiUser, UserProfilePicture } from '@/interfaces/users.interface';
import { PROFILE_PICTURE_SIZE } from '@/utils/costants';
import { boolean } from 'boolean';

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

  public async findFriendsByUserId(
    userId: number,
    query: string | null = null,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    data: ApiUser[];
    total: number;
  }> {
    const SqlSpName = 'Sp_GetUserFriends';

    var users: ApiUser[] = [];

    const prmQuery = query && query.length > 0 ? query : null;
    const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
    const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

    let userFriendsCount: number = 0;

    await knex
      .raw(`CALL ${SqlSpName}(${userId}, ${prmQuery ? `'${prmQuery}'` : null}, ${prmLimit}, ${prmOffset});`)
      .then(async result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          Array.isArray(result[0][0]) &&
          result[0][0].length > 0
        ) {
          let rUsers = result[0][0];
          for (let i = 0; i < rUsers.length; i++) {
            let userObject: {
              id: number;
              username: string;
              fullname: string;
              profilePictureUrl: string | null;
              profilePictureBlurHash: string | null;
              profilePictureWidth: number | null;
              profilePictureHeight: number | null;
              biography: string | null;
              isVerified: boolean;
              acceptedAt: Date;
              streak: number;
              lastSnapSyncAt: Date | null;
              count: number | null;
            } = rUsers[i];
            if (i === 0 && userObject.count !== undefined && userObject.count !== null) userFriendsCount = userObject.count;

            let profilePicture: UserProfilePicture | null = null;

            if (userObject.profilePictureUrl) {
              profilePicture = {
                url: userObject.profilePictureUrl,
                width: userObject.profilePictureWidth || PROFILE_PICTURE_SIZE,
                height: userObject.profilePictureHeight || PROFILE_PICTURE_SIZE,
                blurHash: userObject.profilePictureBlurHash || null,
              };
            }

            users.push({
              id: userObject.id,
              username: userObject.username,
              fullname: userObject.fullname,
              profilePicture: profilePicture,
              isVerified: boolean(userObject.isVerified),
              streak: userObject.streak,
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return {
      data: users,
      total: userFriendsCount,
    };
  }

  public async findMutualFriendsByUserId(
    userId: number,
    loggedUserId: number,
    // query: string | null = null,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    data: ApiUser[];
    total: number;
  }> {
    const SqlSpName = 'Sp_GetMutualFriends';

    var users: ApiUser[] = [];

    // const prmQuery = query && query.length > 0 ? query : null;
    const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
    const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

    let userMutualFriendsCount: number = 0;

    await knex
      .raw(`CALL ${SqlSpName}(${userId}, ${loggedUserId}, ${prmLimit}, ${prmOffset});`)
      .then(async result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          Array.isArray(result[0][0]) &&
          result[0][0].length > 0
        ) {
          let rUsers = result[0][0];
          for (let i = 0; i < rUsers.length; i++) {
            let userObject: {
              a: number;
              b: number;
              id: number;
              username: string;
              fullname: string;
              profilePictureUrl: string | null;
              profilePictureWidth: number | null;
              profilePictureHeight: number | null;
              profilePictureBlurHash: string | null;
              biography: string | null;
              isVerified: boolean;
              count: number | null;
            } = rUsers[i];
            if (i === 0 && userObject.count !== undefined && userObject.count !== null) userMutualFriendsCount = userObject.count;

            let profilePicture: UserProfilePicture | null = null;

            if (userObject.profilePictureUrl) {
              profilePicture = {
                url: userObject.profilePictureUrl,
                width: userObject.profilePictureWidth || PROFILE_PICTURE_SIZE,
                height: userObject.profilePictureHeight || PROFILE_PICTURE_SIZE,
                blurHash: userObject.profilePictureBlurHash || null,
              };
            }

            users.push({
              id: userObject.id,
              username: userObject.username,
              fullname: userObject.fullname,
              profilePicture: profilePicture,
              isVerified: boolean(userObject.isVerified),
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return {
      data: users,
      total: userMutualFriendsCount,
    };
  }

  public async findSuggestionsByUserId(
    userId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    data: ApiUser[];
  }> {
    const SqlSpName = 'Sp_PeopleYouMayKnow';

    var users: ApiUser[] = [];

    const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
    const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

    await knex
      .raw(`CALL ${SqlSpName}(${userId}, ${prmLimit}, ${prmOffset});`)
      .then(async result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          Array.isArray(result[0][0]) &&
          result[0][0].length > 0
        ) {
          let rUsers = result[0][0];
          for (let i = 0; i < rUsers.length; i++) {
            let userObject: {
              id: number;
              username: string;
              fullname: string;
              profilePictureUrl: string | null;
              profilePictureWidth: number | null;
              profilePictureHeight: number | null;
              profilePictureBlurHash: string | null;
              biography: string | null;
              isVerified: boolean;
              contactNickname: string | null;
              mutualFriends: number | null;
            } = rUsers[i];
            // if (i === 0 && userObject.count !== undefined && userObject.count !== null) userSuggestionsCount = userObject.count;

            let profilePicture: UserProfilePicture | null = null;

            if (userObject.profilePictureUrl) {
              profilePicture = {
                url: userObject.profilePictureUrl,
                width: userObject.profilePictureWidth || PROFILE_PICTURE_SIZE,
                height: userObject.profilePictureHeight || PROFILE_PICTURE_SIZE,
                blurHash: userObject.profilePictureBlurHash || null,
              };
            }

            users.push({
              id: userObject.id,
              username: userObject.username,
              fullname: userObject.fullname,
              profilePicture: profilePicture,
              isVerified: boolean(userObject.isVerified),

              biography: userObject.biography,

              contactNickname: userObject && userObject.contactNickname ? userObject.contactNickname : undefined,
              mutualFriends: userObject && userObject.mutualFriends && userObject.mutualFriends > 0 ? userObject.mutualFriends : undefined,
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return {
      data: users,
    };
  }

  public async findReceivedFriendRequestsByUserId(
    userId: number,
    query: string | null = null,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    data: ApiUser[];
    total: number;
  }> {
    const SqlSpName = 'Sp_GetReceivedFriendRequests';

    var users: ApiUser[] = [];

    const prmQuery = query && query.length > 0 ? query : null;
    const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
    const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

    let count: number = 0;

    await knex
      .raw(`CALL ${SqlSpName}(${userId}, ${prmQuery ? `'${prmQuery}'` : null}, ${prmLimit}, ${prmOffset});`)
      .then(async result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          Array.isArray(result[0][0]) &&
          result[0][0].length > 0
        ) {
          let rUsers = result[0][0];
          for (let i = 0; i < rUsers.length; i++) {
            let userObject: {
              id: number;
              username: string;
              fullname: string;
              profilePictureUrl: string | null;
              profilePictureBlurHash: string | null;
              profilePictureWidth: number | null;
              profilePictureHeight: number | null;
              biography: string | null;
              isVerified: boolean;
              createdAt: Date;
              nickname: string | null;
              count: number | null;
            } = rUsers[i];

            if (i === 0 && userObject.count !== undefined && userObject.count !== null) count = userObject.count;

            let profilePicture: UserProfilePicture | null = null;

            if (userObject.profilePictureUrl) {
              profilePicture = {
                url: userObject.profilePictureUrl,
                width: userObject.profilePictureWidth || PROFILE_PICTURE_SIZE,
                height: userObject.profilePictureHeight || PROFILE_PICTURE_SIZE,
                blurHash: userObject.profilePictureBlurHash || null,
              };
            }

            users.push({
              id: userObject.id,
              username: userObject.username,
              fullname: userObject.fullname,
              isVerified: boolean(userObject.isVerified),
              profilePicture: profilePicture,
              contactNickname: userObject.nickname,
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return {
      data: users,
      total: count,
    };
  }

  public async findSentFriendRequestsByUserId(
    userId: number,
    query: string | null = null,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    data: ApiUser[];
    total: number;
  }> {
    const SqlSpName = 'Sp_GetSentFriendRequests';

    var users: ApiUser[] = [];

    const prmQuery = query && query.length > 0 ? query : null;
    const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
    const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

    let count: number = 0;

    await knex
      .raw(`CALL ${SqlSpName}(${userId}, ${prmQuery ? `'${prmQuery}'` : null}, ${prmLimit}, ${prmOffset});`)
      .then(async result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          Array.isArray(result[0][0]) &&
          result[0][0].length > 0
        ) {
          let rUsers = result[0][0];
          for (let i = 0; i < rUsers.length; i++) {
            let userObject: {
              id: number;
              username: string;
              fullname: string;
              profilePictureUrl: string | null;
              profilePictureBlurHash: string | null;
              profilePictureWidth: number | null;
              profilePictureHeight: number | null;
              biography: string | null;
              isVerified: boolean;
              createdAt: Date;
              count: number | null;
            } = rUsers[i];

            if (i === 0 && userObject.count !== undefined && userObject.count !== null) count = userObject.count;

            let profilePicture: UserProfilePicture | null = null;

            if (userObject.profilePictureUrl) {
              profilePicture = {
                url: userObject.profilePictureUrl,
                width: userObject.profilePictureWidth || PROFILE_PICTURE_SIZE,
                height: userObject.profilePictureHeight || PROFILE_PICTURE_SIZE,
                blurHash: userObject.profilePictureBlurHash || null,
              };
            }

            users.push({
              id: userObject.id,
              username: userObject.username,
              fullname: userObject.fullname,
              isVerified: boolean(userObject.isVerified),
              profilePicture: profilePicture,
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return {
      data: users,
      total: count,
    };
  }

  public async countReceivedFriendRequests(userId: number, query: string | null = null): Promise<number> {
    /**
     * params:
     * userId: number
     * query: string | null = null
     */
    const SqlFnName = 'Fn_GetReceivedFriendRequestsCount';

    var count = 0;

    const prmQuery = query && query.length > 0 ? query : null;

    await knex
      .raw(`SELECT ${SqlFnName}(${userId}, ${prmQuery ? `'${prmQuery}'` : null}) AS count;`)
      .then(result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          result[0][0].count !== undefined
        ) {
          count = result[0][0].count;
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return count;
  }

  public async countSentFriendRequests(userId: number, query: string | null = null): Promise<number> {
    /**
     * params:
     * userId: number
     * query: string | null = null
     */
    const SqlFnName = 'Fn_GetSentFriendRequestsCount';

    var count = 0;

    const prmQuery = query && query.length > 0 ? query : null;

    await knex
      .raw(`SELECT ${SqlFnName}(${userId}, ${prmQuery ? `'${prmQuery}'` : null}) AS count;`)
      .then(result => {
        if (
          result &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0]) &&
          result[0].length > 0 &&
          result[0][0].count !== undefined
        ) {
          count = result[0][0].count;
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return count;
  }

  public async createFriendship(userId: number, friendId: number): Promise<void> {
    const findUser = await Users.query().whereNotDeleted().findById(userId); // Logged User
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findFriend = await Users.query().whereNotDeleted().findById(friendId); // User to add
    if (!findFriend) throw new SnapSyncException(404, 'Not Found');

    if (findUser.id === findFriend.id) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che findFriend non abbiano bloccato findUser
    const isBlocked = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findFriend.id).andWhere('blockedUserId', findUser.id).first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    const isBlocking = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findUser.id).andWhere('blockedUserId', findFriend.id).first();
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
      .andWhere('friendId', userId)
      .andWhere('userId', friendId)
      .first();
    if (incomingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Controllo se esiste una richiesta in uscita
    const outgoingRequest = await Friends.query()
      .whereNotDeleted()
      .andWhere('status', StatusEnum.pending)
      .andWhere('friendshipHash', fh)
      .andWhere('friendId', friendId)
      .andWhere('userId', userId)
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
    const findUser = await Users.query().whereNotDeleted().findById(userId); // Logged User -> quelle che riceve la richiesta
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findFriend = await Users.query().whereNotDeleted().findById(friendId); // quelle che invia la richiesta
    if (!findFriend) throw new SnapSyncException(404, 'Not Found');

    if (findUser.id === findFriend.id) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che findFriend non abbiano bloccato findUser
    const isBlocked = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findFriend.id).andWhere('blockedUserId', findUser.id).first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    const isBlocking = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findUser.id).andWhere('blockedUserId', findFriend.id).first();
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
      .andWhere('friendId', findUser.id)
      .andWhere('userId', findFriend.id)
      .first();
    if (!incomingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Accetto la richiesta
    await Friends.query().patchAndFetchById(incomingRequest.id, {
      acceptedAt: new Date(),
      status: 'accepted',
    });
  }

  public async rejectFriendship(userId: number, friendId: number): Promise<void> {
    const findUser = await Users.query().whereNotDeleted().findById(userId); // Logged User -> quelle che riceve la richiesta
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findFriend = await Users.query().whereNotDeleted().findById(friendId); // quelle che invia la richiesta
    if (!findFriend) throw new SnapSyncException(404, 'Not Found');

    if (findUser.id === findFriend.id) throw new SnapSyncException(400, 'Bad Request');

    // Controllo che findFriend non abbiano bloccato findUser
    const isBlocked = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findFriend.id).andWhere('blockedUserId', findUser.id).first();
    if (isBlocked) throw new SnapSyncException(404, 'Not Found');

    const isBlocking = await BlockedUsers.query().whereNotDeleted().andWhere('userId', findUser.id).andWhere('blockedUserId', findFriend.id).first();
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
      .andWhere('friendId', findUser.id)
      .andWhere('userId', findFriend.id)
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

  public async destroyFriendship(userId: number, friendId: number): Promise<void> {
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

    // Per poter eliminare un record devo essere amici oppure userId deve aver inviato una richiesta a friendId
    let areFriends = await this.areFriends(userId, friendId);

    const fh = generateFriendshipHash(userId, friendId);
    const outgoingRequest = await Friends.query()
      .whereNotDeleted()
      .andWhere('status', StatusEnum.pending)
      .andWhere('friendshipHash', fh)
      .andWhere('friendId', friendId)
      .andWhere('userId', userId)
      .first();

    if (!areFriends && !outgoingRequest) throw new SnapSyncException(400, 'Bad Request');

    // Elimino la richiesta
    await Friends.query().delete().where('friendshipHash', fh);
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
}

export default FriendService;
