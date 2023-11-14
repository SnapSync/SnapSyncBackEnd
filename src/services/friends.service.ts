import { SqlException } from '@/exceptions/SqlException';
import { RoutePagination } from '@/interfaces/routes.interface';
import { ApiUser } from '@/interfaces/users.interface';
import knex from '@databases';
import UserService from './users.service';

class FriendService {
  public async findFriendsCountByUserId(userId: number, loggedUserId: number, query?: string): Promise<number> {
    const fnName = 'Fn_GetFriendsCount';

    var friendsCount = 0;

    try {
      const prmQuery = query && query.length > 0 ? query : null;
      await knex
        .raw(
          `
                SELECT ${fnName}(${userId}, ${loggedUserId}, ${prmQuery}}) AS count;
            `,
        )
        .then(result => {
          if (
            result &&
            Array.isArray(result) &&
            result.length > 0 &&
            Array.isArray(result[0]) &&
            result[0].length > 0 &&
            result[0][0].count !== undefined
          ) {
            friendsCount = result[0][0].count;
          }
        })
        .catch(error => {
          throw new SqlException(error);
        });
    } catch (error) {
      throw error;
    }

    return friendsCount;
  }

  public async findFriendsByUserId(
    userId: number,
    loggedUserId: number,
    query?: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    users: ApiUser[];
    pagination: RoutePagination;
  }> {
    const spName = 'Sp_GetFriends';

    var users: ApiUser[] = [];
    var pagination: RoutePagination = {
      total: 0,
      page: 0,
      size: 0,
      hasMore: false,
    };

    try {
      const prmQuery = query && query.length > 0 ? query : null;

      const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
      const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

      const queryToExecute = `
                CALL ${spName}(${userId}, ${loggedUserId}, ${prmQuery}, ${prmLimit}, ${prmOffset});
            `;

      await knex
        .raw(queryToExecute)
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
            const total = rUsers[0].total;

            pagination.hasMore = total > prmOffset + prmLimit;
            pagination.page = Math.floor(prmOffset / prmLimit) + 1;
            pagination.size = prmLimit;
            pagination.total = total;

            for (let i = 0; i < rUsers.length; i++) {
              let us = await new UserService().findApiUserById(rUsers[i].userId);
              users.push(us);
            }
          }
        })
        .catch(error => {
          throw new SqlException(error);
        });
    } catch (error) {
      throw error;
    }

    return {
      users,
      pagination,
    };
  }

  public async findMutualFriendsCountByUserId(userId: number, loggedUserId: number, query?: string): Promise<number> {
    const fnName = 'Fn_GetMutualFriendsCount';

    var mutualFriendsCount = 0;

    try {
      const prmQuery = query && query.length > 0 ? query : null;
      await knex
        .raw(
          `
                SELECT ${fnName}(${userId}, ${loggedUserId}, ${prmQuery}) AS count;
            `,
        )
        .then(result => {
          if (
            result &&
            Array.isArray(result) &&
            result.length > 0 &&
            Array.isArray(result[0]) &&
            result[0].length > 0 &&
            result[0][0].count !== undefined
          ) {
            mutualFriendsCount = result[0][0].count;
          }
        })
        .catch(error => {
          throw new SqlException(error);
        });
    } catch (error) {
      throw error;
    }

    return mutualFriendsCount;
  }

  public async findMutualFriendsByUserId(
    userId: number,
    loggedUserId: number,
    query?: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    users: ApiUser[];
    pagination: RoutePagination;
  }> {
    const spName = 'Sp_GetMutualFriends';

    var users: ApiUser[] = [];
    var pagination: RoutePagination = {
      total: 0,
      page: 0,
      size: 0,
      hasMore: false,
    };

    try {
        const prmQuery = query && query.length > 0 ? query : null;

        const prmLimit = limit !== undefined && limit > 0 ? limit : 10;
        const prmOffset = offset !== undefined && offset > 0 ? offset : 0;

        const queryToExecute = `
                CALL ${spName}(${userId}, ${loggedUserId}, ${prmQuery}, ${prmLimit}, ${prmOffset});
            `;

        await knex.raw(queryToExecute).then(async result => {
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
                const total = rUsers[0].total;

                pagination.hasMore = total > prmOffset + prmLimit;
                pagination.page = Math.floor(prmOffset / prmLimit) + 1;
                pagination.size = prmLimit;
                pagination.total = total;

                for (let i = 0; i < rUsers.length; i++) {
                    let us = await new UserService().findApiUserById(rUsers[i].userId);
                    users.push(us);
                }
            }
        }).catch(error => {
            throw new SqlException(error);
        })  
        
    } catch (error) {
        throw error;
        }

    return {
      users,
      pagination,
    };
  }
}

export default FriendService;
