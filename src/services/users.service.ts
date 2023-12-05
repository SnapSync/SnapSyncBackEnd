import { ApiUser, User, UserProfile, UserProfilePicture } from '@/interfaces/users.interface';
import { Users } from '@/models/users.model';
import { boolean } from 'boolean';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import {
  FULLNAME_REGEX,
  MAX_BIO_LENGTH,
  MAX_FULLNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_FULLNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  PROFILE_PICTURE_SIZE,
  USERNAME_REGEX,
} from '@/utils/costants';
import { UpdateProfilePictureDto } from '@/dtos/users.dto';
import { isEmpty } from '@/utils/util';

class UserService {
  public async findAllUsers(): Promise<ApiUser[]> {
    const findAllUsers: User[] = await Users.query().whereNotDeleted();

    let apiUsers: ApiUser[] = [];

    for (let i = 0; i < findAllUsers.length; i++) {
      const findUser = findAllUsers[i];

      let profilePicture: UserProfilePicture | null = null;

      if (findUser.profilePictureUrl) {
        profilePicture = {
          url: findUser.profilePictureUrl,
          width: findUser.profilePictureWidth || PROFILE_PICTURE_SIZE,
          height: findUser.profilePictureHeight || PROFILE_PICTURE_SIZE,
          blurHash: findUser.profilePictureBlurHash || null,
        };
      }

      const apiUser: ApiUser = {
        id: findUser.id,
        username: findUser.username,
        fullname: findUser.fullname,
        isVerified: boolean(findUser.isVerified),
        profilePicture: profilePicture,
      };

      apiUsers.push(apiUser);
    }

    return apiUsers;
  }

  public async findUserById(userId: number): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

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

    let profilePicture: UserProfilePicture | null = null;

    if (findOne.profilePictureUrl) {
      profilePicture = {
        url: findOne.profilePictureUrl,
        width: findOne.profilePictureWidth || PROFILE_PICTURE_SIZE,
        height: findOne.profilePictureHeight || PROFILE_PICTURE_SIZE,
        blurHash: findOne.profilePictureBlurHash || null,
      };
    }

    const apiUser: ApiUser = {
      id: findOne.id,
      username: findOne.username,
      fullname: findOne.fullname,
      isVerified: boolean(findOne.isVerified),
      profilePicture: profilePicture,
      biography: findOne.biography,
    };

    return apiUser;
  }

  public async findUserProfileById(userId: number, loggedUserId: number): Promise<UserProfile> {
    const findUser = await Users.query().whereNotDeleted().findById(userId);
    if (!findUser) throw new SnapSyncException(404, 'Not Found');

    const findLoggedUser = await Users.query().whereNotDeleted().findById(loggedUserId);
    if (!findLoggedUser) throw new SnapSyncException(404, 'Not Found');

    let profilePicture: UserProfilePicture | null = null;

    if (findUser.profilePictureUrl) {
      profilePicture = {
        url: findUser.profilePictureUrl,
        width: findUser.profilePictureWidth || PROFILE_PICTURE_SIZE,
        height: findUser.profilePictureHeight || PROFILE_PICTURE_SIZE,
        blurHash: findUser.profilePictureBlurHash || null,
      };
    }

    const isMyProfile = findUser.id === findLoggedUser.id;

    // let friendshipStatus: FriendshipStatus | undefined = undefined;

    // if (!isMyProfile) {
    //   friendshipStatus = await new FriendService().getFriendshipStatus(findUser.id, findLoggedUser.id);
    // }

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

      streak: !isMyProfile ? Math.floor(Math.random() * 100) : undefined,

      // friendshipStatus: friendshipStatus,
    };

    return up;
  }

  public async updateUsername(userId: number, username: string): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const trimmedUsername = username.toLocaleLowerCase().trim();

    if (trimmedUsername.length < MIN_USERNAME_LENGTH || trimmedUsername.length > MAX_USERNAME_LENGTH || !USERNAME_REGEX.test(trimmedUsername)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['username']);
    }

    const alreadyExists = await Users.query().whereNotDeleted().andWhere('username', trimmedUsername).first();
    if (alreadyExists) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['username']);
    }

    const updatedUser = await Users.query().patchAndFetchById(userId, { username: trimmedUsername, updatedAt: new Date() });

    return updatedUser;
  }

  public async updateFullname(userId: number, fullname: string): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const trimmedFullName = fullname.trim();

    // Controllo se il nome e cognome è valido, in teoria non dovrebbe mai succedere, poichè ci dovrebbe essere la validazione nel controller
    if (trimmedFullName.length < MIN_FULLNAME_LENGTH || trimmedFullName.length > MAX_FULLNAME_LENGTH || !FULLNAME_REGEX.test(trimmedFullName)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['fullname']);
    }

    const updatedUser = await Users.query().patchAndFetchById(userId, { fullname: trimmedFullName, updatedAt: new Date() });

    return updatedUser;
  }

  public async updateBiography(userId: number, biography: string | null): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    if (biography && biography.length > MAX_BIO_LENGTH) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['biography']);
    }

    if (biography && biography.length === 0) biography = null;

    const updatedUser = await Users.query().patchAndFetchById(userId, { biography: biography, updatedAt: new Date() });

    return updatedUser;
  }

  public async updateProfilePicture(userId: number, data: UpdateProfilePictureDto): Promise<User> {
    if (isEmpty(data)) throw new SnapSyncException(422, 'Unprocessable Entity');

    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const updatedUser = await Users.query().patchAndFetchById(userId, {
      profilePictureUrl: data.profilePictureUrl,
      profilePictureWidth: data.profilePictureWidth,
      profilePictureHeight: data.profilePictureHeight,
      profilePictureBlurHash: data.profilePictureBlurHash,
      updatedAt: new Date(),
    });

    return updatedUser;
  }

  public async removeProfilePicture(userId: number): Promise<User> {
    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const updatedUser = await Users.query().patchAndFetchById(userId, {
      profilePictureUrl: null,
      profilePictureWidth: null,
      profilePictureHeight: null,
      profilePictureBlurHash: null,
      updatedAt: new Date(),
    });

    return updatedUser;
  }
}

export default UserService;
