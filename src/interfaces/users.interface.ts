export interface User {
  id: number;
  username: string;
  fullName: string;
  profilePicImageKey: string;

  phoneNumber: string; // In formato internazionale, esempio: +393401234567
  phoneNumberOnlyDigits: string; // Solo cifre, esempio: 393401234567
  phoneNumberCountryIso2: string | null; // Codice ISO 3166-1 alpha-2 del paese, esempio: IT
  latitude: number | null; // Indica la latitudine del luogo in cui l'utente si è registrato
  longitude: number | null; // Indica la longitudine del luogo in cui l'utente si è registrato

  dateOfBirth: Date; // Data di nascita

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

export interface ApiUser {
  id: number;
  username: string;
  fullName: string;
  isVerified: boolean;
  profilePictureUrl: string;

  socialContext?: string;
  streak?: number;
}

export interface Biography {
  rawText: string | null;
  entities?: Array<BiographyEntity>;
}

export interface BiographyEntity {
  type: 'user';
  id: number;
  text: string;
}

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  isVerified: boolean;
  profilePictureUrl: string;
  isPrivate: boolean;

  biography: Biography | null;

  mutualFriendsCount?: number; // Nel caso non sia il mio profilo
  friendsCount?: number; // Nel caso sia il mio profilo

  snapsCount: number;

  isMyProfile: boolean;
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
