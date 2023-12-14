import { ApiUser, User, UserProfile, UserProfilePicture, UserProfileZodiacSign } from '@/interfaces/users.interface';
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
import { UpdateProfilePictureDto, UpdateUserDto } from '@/dtos/users.dto';
import { isEmpty } from '@/utils/util';
import knex from '@databases';
import { SqlException } from '@/exceptions/SqlException';

class UserService {
  public async findAllUsers(): Promise<User[]> {
    const findAllUsers: User[] = await Users.query().whereNotDeleted();

    return findAllUsers;
  }

  public async searchUsers(userId: number, query: string, limit: number, offset: number): Promise<ApiUser[]> {
    const SqlSpName = 'Sp_SearchUsers';

    var users: ApiUser[] = [];

    const prmQuery = query && query.length > 0 ? query : null;
    const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
    const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

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
            let userObject: User = rUsers[i];

            let profilePicture: UserProfilePicture | null = null;

            if (userObject.profilePictureUrl) {
              profilePicture = {
                url: userObject.profilePictureUrl,
                width: userObject.profilePictureWidth || PROFILE_PICTURE_SIZE,
                height: userObject.profilePictureHeight || PROFILE_PICTURE_SIZE,
                blurHash: userObject.profilePictureBlurHash || null,
              };
            }

            let zodiacSign: UserProfileZodiacSign = {
              name: userObject.zodiacSignName,
              symbol: userObject.zodiacSignSymbol,
            };

            users.push({
              id: userObject.id,
              username: userObject.username,
              fullname: userObject.fullname,
              profilePicture: profilePicture,
              zodiacSign: zodiacSign,
              isVerified: boolean(userObject.isVerified),
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return users;
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

    let zodiacSign: UserProfileZodiacSign = {
      name: findOne.zodiacSignName,
      symbol: findOne.zodiacSignSymbol,
    };

    const apiUser: ApiUser = {
      id: findOne.id,
      username: findOne.username,
      fullname: findOne.fullname,
      isVerified: boolean(findOne.isVerified),
      profilePicture: profilePicture,
      zodiacSign: zodiacSign,
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

  public async updateUser(userId: number, data: UpdateUserDto): Promise<User> {
    if (isEmpty(data)) throw new SnapSyncException(422, 'Unprocessable Entity');

    const findOne = await Users.query().whereNotDeleted().findById(userId);
    if (!findOne) throw new SnapSyncException(404, 'Not Found');

    const trimmedUsername = data.username.toLocaleLowerCase().trim();
    const trimmedFullName = data.fullname.trim();
    var biography = data.biography ? data.biography.trim() : null;
    if (biography && biography.length === 0) biography = null;

    // Controllo se il nome utente è valido, in teoria non dovrebbe mai succedere, poichè ci dovrebbe essere la validazione nel controller
    if (trimmedUsername.length < MIN_USERNAME_LENGTH || trimmedUsername.length > MAX_USERNAME_LENGTH || !USERNAME_REGEX.test(trimmedUsername)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['username']);
    }

    // Controllo se il nome e cognome è valido, in teoria non dovrebbe mai succedere, poichè ci dovrebbe essere la validazione nel controller
    if (trimmedFullName.length < MIN_FULLNAME_LENGTH || trimmedFullName.length > MAX_FULLNAME_LENGTH || !FULLNAME_REGEX.test(trimmedFullName)) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['fullname']);
    }

    // Controllo se la biografia è valida, in teoria non dovrebbe mai succedere, poichè ci dovrebbe essere la validazione nel controller
    if (biography && biography.length > MAX_BIO_LENGTH) {
      throw new SnapSyncException(422, 'Unprocessable Entity', undefined, undefined, undefined, ['biography']);
    }

    const alreadyExists = await Users.query().whereNotDeleted().andWhere('username', trimmedUsername).first();
    if (alreadyExists && alreadyExists.id !== userId) {
      throw new SnapSyncException(409, 'Conflict', undefined, undefined, undefined, ['username']);
    }

    const updatedUser = await Users.query().patchAndFetchById(userId, {
      username: trimmedUsername,
      fullname: trimmedFullName,
      biography: biography,
      updatedAt: new Date(),
    });

    return updatedUser;
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
