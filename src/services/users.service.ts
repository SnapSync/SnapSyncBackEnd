import { ApiUser, User, UserProfile } from '@/interfaces/users.interface';
import { Users } from '@/models/users.model';
import { boolean } from 'boolean';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { PROFILE_PICTURE_SIZE } from '@/utils/costants';
import { FriendshipStatus } from '@/interfaces/friendship.interface';
import FriendService from './friends.service';
class UserService {
  public async findAllUser(): Promise<User[]> {
    const findAllUsers: User[] = await Users.query().whereNotDeleted();
    return findAllUsers;
  }

  public async findUserById(userId: number): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) new SnapSyncException(404, 'Not Found');

    return findOne;
  }

  public async findUserByPhoneNumber(phoneNumber: string): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().andWhere('phoneNumber', phoneNumber).first();
    if (!findOne) throw new SnapSyncException(404, 'Not Found');
    return findOne;
  }

  public async findUserByUsername(username: string): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().andWhere('username', username).first();
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    return findOne;
  }

  public async findApiUserById(userId: number): Promise<ApiUser> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    let profilePicture: {
      url: string;
      width: number;
      height: number;
    } | null = null;

    if (findOne.profilePictureUrl) {
      profilePicture = {
        url: findOne.profilePictureUrl,
        width: findOne.profilePictureWidth || PROFILE_PICTURE_SIZE,
        height: findOne.profilePictureHeight || PROFILE_PICTURE_SIZE,
      };
    }

    const apiUser: ApiUser = {
      id: findOne.id,
      username: findOne.username,
      fullname: findOne.fullname,
      isVerified: boolean(findOne.isVerified),
      profilePicture: profilePicture,
    };

    return apiUser;
  }

  public async findUserProfileById(userId: number, loggedUserId: number): Promise<UserProfile> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findLoggedUser = await Users.query().whereNotDeleted().findById(loggedUserId);
    if (!findLoggedUser) throw new SnapSyncException(404, 'Not Found');

    let profilePicture: {
      url: string;
      width: number;
      height: number;
    } | null = null;

    if (findUser.profilePictureUrl) {
      profilePicture = {
        url: findUser.profilePictureUrl,
        width: findUser.profilePictureWidth || PROFILE_PICTURE_SIZE,
        height: findUser.profilePictureHeight || PROFILE_PICTURE_SIZE,
      };
    }

    const isMyProfile = findUser.id === findLoggedUser.id;

    let friendshipStatus: FriendshipStatus | undefined = undefined;

    if (!isMyProfile) {
      friendshipStatus = await new FriendService().getFriendshipStatus(findUser.id, findLoggedUser.id);
    }

    const up: UserProfile = {
      id: findUser.id,
      username: findUser.username,
      dateOfBirth: findUser.dateOfBirth,
      fullname: findUser.fullname,
      isVerified: boolean(findUser.isVerified),

      phoneNumber: isMyProfile ? findUser.phoneNumber : undefined,

      biography: findUser.biography,
      location: null,
      profilePicture: profilePicture,

      isPrivate: boolean(findUser.isPrivate),

      isMyProfile: isMyProfile,

      friendshipStatus: friendshipStatus,
    };

    return up;
  }
}

export default UserService;
