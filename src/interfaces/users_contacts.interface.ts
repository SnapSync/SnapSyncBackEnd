export interface UserContact {
  id: number;
  userId: number;
  contactId: number;
  nickname: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  unarchived: boolean;
}
