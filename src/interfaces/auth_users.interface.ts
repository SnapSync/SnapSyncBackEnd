export interface AuthUser {
  id: number;
  sessionId: string;
  username: string | null;
  fullname: string | null;
  phoneNumber: string | null;
  isPhoneNumberVerified: boolean;

  dateOfBirth: Date | null;
  otpSendedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  unarchived: boolean;
}
