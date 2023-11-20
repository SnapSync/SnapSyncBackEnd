import { HttpException } from '@/exceptions/HttpException';
import { ApiUser, Biography, BiographyEntity, User, UserProfile } from '@/interfaces/users.interface';
import { Users } from '@/models/users.model';
import { boolean } from 'boolean';
import AwsService from './aws.service';
import FriendService from './friends.service';
import { BlockedUsers } from '@/models/blocked_users.model';
import { SnapSyncErrorType } from '@/utils/enum';
class UserService {
  public async findAllUser(): Promise<User[]> {
    const findAllUsers: User[] = await Users.query().whereNotDeleted();
    return findAllUsers;
  }

  public async findUserById(userId: number): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    return findOne;
  }

  public async findUserByPhoneNumber(phoneNumber: string): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().andWhere('phoneNumber', phoneNumber).first();
    if (!findOne) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError);
    return findOne;
  }

  public async findUserByUsername(username: string): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().andWhere('username', username).first();
    if (!findOne) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    return findOne;
  }

  public async findApiUserById(userId: number): Promise<ApiUser> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    const profilePictureUrl = await new AwsService().getSignedUrl(findOne.profilePicImageKey);

    const apiUser: ApiUser = {
      id: findOne.id,
      username: findOne.username,
      fullName: findOne.fullName,
      isVerified: boolean(findOne.isVerified),
      profilePictureUrl: profilePictureUrl,
    };

    return apiUser;
  }

  public async findUserBiographyById(userId: number, loggedUserId: number): Promise<Biography | null> {
    const findOneUserData = await Users.query().whereNotDeleted().findById(userId);
    if (!findOneUserData) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError);

    if (findOneUserData.biography) {
      const words = findOneUserData.biography.split(' ');

      let entities: BiographyEntity[] = [];

      await Promise.all(
        words.map(async word => {
          if (word.startsWith('@')) {
            // Username
            let username = word.substring(1);

            try {
              let user = await this.findUserByUsername(username);

              let blockedUser = await BlockedUsers.query().whereNotDeleted().where('userId', user.id).andWhere('blockedUserId', loggedUserId).first();
              if (blockedUser) return;

              entities.push({
                type: 'user',
                id: user.id,
                text: user.username,
              });
            } catch (error) {
              // Non esiste l'utente, non faccio nulla
              return;
            }
          }
        }),
      );

      let biography: Biography = {
        rawText: findOneUserData.biography,
        entities: entities,
      };

      return biography;
    }

    return null;
  }

  public async findUserProfileById(userId: number, loggedUserId: number): Promise<UserProfile> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError); // L'utente non esiste

    const findLoggedUser = await Users.query().whereNotDeleted().findById(loggedUserId);
    if (!findLoggedUser) new HttpException(404, 'errors.user_not_found', 'User not found', undefined, SnapSyncErrorType.HttpNotFoundError); // L'utente loggato non esiste

    const profilePictureUrl = await new AwsService().getSignedUrl(findUser.profilePicImageKey);

    const isMyProfile = findUser.id === findLoggedUser.id;

    var mutualFriendsCount: number | undefined = undefined;
    var friendsCount: number | undefined = undefined;

    if (isMyProfile) {
      // Se è il mio profilo, allora friendsCount è il numero di amici
      friendsCount = await new FriendService().findFriendsCountByUserId(findUser.id, findUser.id);
    } else {
      mutualFriendsCount = await new FriendService().findMutualFriendsCountByUserId(findUser.id, findLoggedUser.id);
    }

    const bio = await this.findUserBiographyById(userId, loggedUserId);

    const up: UserProfile = {
      id: findUser.id,
      username: findUser.username,
      fullName: findUser.fullName,
      isVerified: boolean(findUser.isVerified),
      profilePictureUrl: profilePictureUrl,
      isPrivate: boolean(findUser.isPrivate),

      biography: bio,

      friendsCount: friendsCount,
      mutualFriendsCount: mutualFriendsCount,

      snapsCount: 0,

      isMyProfile: isMyProfile,
    };

    return up;
  }
}

export default UserService;
