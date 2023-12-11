export class UpdateProfilePictureDto {
  profilePictureUrl: string;
  profilePictureBlurHash: string | null;
  profilePictureWidth: number;
  profilePictureHeight: number;
}

export class UpdateUserDto {
  username: string;
  fullname: string;
  biography: string | null;
}
