import Status from '@/types/status.type';

export interface Friend {
  id: number;
  userId: number;
  friendId: number;

  status: Status;
  acceptedAt: Date | null;
  rejectedAt: Date | null;

  streak: number;
  lastSnapSyncAt: Date | null;

  friendshipHash: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  unarchived: boolean;
}
