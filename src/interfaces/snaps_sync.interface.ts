export interface SnapSync {
  id: number;
  userId: number;
  memberId: number;

  instanceKey: string;

  timerStarted: boolean;
  timerSeconds: number;
  timerStartedAt: Date | null;

  timerPublishStarted: boolean;
  timerPublishSeconds: number;
  timerPublishStartedAt: Date | null;

  isPublished: boolean;
  publishedAt: Date | null;

  snapSyncHash: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  unarchived: boolean;
}
