import { FriendshipStatus } from './friendship_statuses.interface';
import { User } from './users.interface';

export interface Friend {
  id: number;
  userId: number;
  friendId: number;
  friendshipStatusId: number;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  snapSyncStreak: number;
  lastSnapSync: Date | null;

  friendshipHash: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  unarchived: boolean;


  user?: User;
  friend?: User;
  friendshipStatus?: FriendshipStatus;
}

export interface FriendshipStatusBetweenUsers {
  isFriend: boolean;

  incomingRequest: boolean;
  outgoingRequest: boolean;

  isBlocking: boolean;
}
