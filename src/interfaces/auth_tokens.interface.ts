export interface AuthToken {
  id: number;
  userId: number;
  selector: string;
  hashedValidator: string;
  lastUsedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
