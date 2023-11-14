import { HttpException } from "@/exceptions/HttpException";
import { BlockedUsers } from "@/models/blocked_users.model";
import { Users } from "@/models/users.model";

class BlockedUserService {
    public async isBlockedByUser(userId: number, blockedUserId: number): Promise<boolean> {
        const findUser = await Users.query().whereNotDeleted().findById(userId);
        if (!findUser) throw new HttpException(404, 'User not found');

        const findBlockedUser = await Users.query().whereNotDeleted().findById(blockedUserId);
        if (!findBlockedUser) throw new HttpException(404, 'Blocked user not found');

        const findBU = await BlockedUsers.query().whereNotDeleted().andWhere('userId', userId).andWhere('blockedUserId', blockedUserId).first();

        if (findBU) return true;
        else return false;
    }
}

export default BlockedUserService;