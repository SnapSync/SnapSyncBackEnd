export interface AuthUser {
  id: number;
  deviceId: number;
  sessionId: string;
  username: string | null;
  fullName: string | null;
  profilePicImageKey: string | null;
  phoneNumber: string | null;
  isPhoneNumberVerified: boolean;

  dateOfBirth: Date | null;
  otpSendedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  unarchived: boolean;
}
