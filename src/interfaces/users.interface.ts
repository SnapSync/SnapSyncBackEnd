export interface User {
  id: number;
  username: string;
  fullname: string;
  // profilePicImageKey: string;

  profilePictureUrl: string | null;
  profilePictureBlurHash: string | null;
  profilePictureWidth: number | null;
  profilePictureHeight: number | null;

  phoneNumber: string; // In formato internazionale, esempio: +393401234567

  dateOfBirth: Date; // Data di nascita
  zodiacSignSymbol: string; // Simbolo dello zodiaco, esempio: ♈
  zodiacSignName: string; // Nome dello zodiaco, esempio: Ariete

  biography: string | null;

  isVerified: boolean;
  verifiedAt: Date | null;

  isBanned: boolean;
  bannedAt: Date | null;
  bannedUntil: Date | null;

  isShadowBanned: boolean;
  shadowBannedAt: Date | null;
  shadowBannedUntil: Date | null;
  isPrivate: boolean;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  unarchived: boolean;
}

export interface UserProfilePicture {
  url: string;
  width: number;
  height: number;
  blurHash: string | null;
}

export interface UserProfileZodiacSign {
  name: string;
  symbol: string;
}

export interface ApiUser {
  id: number;
  username: string;
  fullname: string;
  isVerified: boolean;
  profilePicture: UserProfilePicture | null;
  zodiacSign: UserProfileZodiacSign;

  biography?: string | null;

  // contactNickname?: string;
  mutualFriends?: number;
  streak?: number;
}

export interface UserProfile {
  id: number;
  username: string;
  dateOfBirth: Date;
  fullname: string;
  isVerified: boolean;

  phoneNumber?: string; // Visibile solo se è il mio profilo

  biography: string | null;

  location: {
    latitude: number;
    longitude: number;
  } | null;

  profilePicture: UserProfilePicture | null;

  isPrivate: boolean;

  isMyProfile: boolean;

  streak?: number | null;

  // friendshipStatus?: FriendshipStatus;
}

/**
 * id: number
 * username: string
 * fullname: string
 * biography: string | null
 * profilePicture: {
 *  height: number,
 *  width: number,
 *  url: string
 * } | undefined
 */

// Salvo le immagini del profilo con un ratio di 1:1 -> 500x500
// Salvo le immagini dei post con un ratio di 3:4 -> 1500x2000
