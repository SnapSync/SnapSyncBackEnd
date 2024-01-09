import { PROFILE_PICTURE_SIZE } from '@/utils/costants';
import { ApiUser, UserProfilePicture } from '@/interfaces/users.interface';
import { SqlException } from '@/exceptions/SqlException';
import { boolean } from 'boolean';
import knex from '@databases';

class UserContactService {
  public async searchUserContacts(userId: number, query: string, limit: number, offset: number): Promise<ApiUser[]> {
    const SqlSpName = 'Sp_SearchUserContacts';

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
              nickname: string | null;
            } = rUsers[i];

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
              biography: userObject.biography || undefined,
              contactNickname: userObject.nickname || undefined,
            });
          }
        }
      })
      .catch(error => {
        throw new SqlException(error);
      });

    return users;
  }
}

export default UserContactService;
