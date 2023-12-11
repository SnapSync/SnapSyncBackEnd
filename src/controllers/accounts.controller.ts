import { SnapSyncException } from '@/exceptions/SnapSyncException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { User, UserProfilePicture } from '@/interfaces/users.interface';
import AwsService from '@/services/aws.service';
import UserService from '@/services/users.service';
import {
  FULLNAME_REGEX,
  MAX_BIO_LENGTH,
  MAX_FULLNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_FULLNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  PROFILE_PICTURE_SIZE,
  USERNAME_REGEX,
} from '@/utils/costants';
import { NextFunction, Response } from 'express';
import * as yup from 'yup';
import sizeOf from 'image-size';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { v4 as uuidv4 } from 'uuid';
import { UpdateProfilePictureDto, UpdateUserDto } from '@/dtos/users.dto';

class AccountsController {
  public userService = new UserService();
  public awsService = new AwsService();

  public getWebFormData = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new SnapSyncException(401, 'Unauthorized');

      const formData = this.generateWebFormData(req.user);

      res.status(200).json({ ...formData });
    } catch (error) {
      next(error);
    }
  };

  public editAccount = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const validationSchema = yup.object().shape({
      username: yup.string().required().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH).matches(USERNAME_REGEX),
      fullname: yup.string().required().min(MIN_FULLNAME_LENGTH).max(MAX_FULLNAME_LENGTH).matches(FULLNAME_REGEX),
      biography: yup.string().nullable().max(MAX_BIO_LENGTH),
    });

    try {
      await validationSchema.validate(req.body, { abortEarly: false });

      const data: UpdateUserDto = {
        username: req.body.username.toLocaleLowerCase().trim(),
        fullname: req.body.fullname.trim(),
        biography: req.body.biography,
      };

      const updatedUser = await this.userService.updateUser(req.user.id, data);

      const formData = this.generateWebFormData(updatedUser);

      res.status(200).json({ ...formData, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  // public changeUsername = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  //   const validationSchema = yup.object().shape({
  //     username: yup.string().required().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH).matches(USERNAME_REGEX),
  //   });

  //   try {
  //     await validationSchema.validate(req.body, { abortEarly: false });

  //     const updatedUser = await this.userService.updateUsername(req.user.id, req.body.username);

  //     res.status(200).json({ username: updatedUser.username, message: 'ok' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // public changeFullName = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  //   const validationSchema = yup.object().shape({
  //     fullname: yup.string().required().min(MIN_FULLNAME_LENGTH).max(MAX_FULLNAME_LENGTH).matches(FULLNAME_REGEX),
  //   });

  //   try {
  //     await validationSchema.validate(req.body, { abortEarly: false });

  //     const updatedUser = await this.userService.updateFullname(req.user.id, req.body.fullname);

  //     res.status(200).json({ fullname: updatedUser.fullname, message: 'ok' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // public changeBiography = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  //   const validationSchema = yup.object().shape({
  //     biography: yup.string().nullable().max(MAX_BIO_LENGTH),
  //   });

  //   try {
  //     await validationSchema.validate(req.body, { abortEarly: false });

  //     const updatedUser = await this.userService.updateBiography(req.user.id, req.body.biography);

  //     res.status(200).json({ biography: updatedUser.biography, message: 'ok' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public changeProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new SnapSyncException(422, 'Unprocessable Entity');

      // check if the file is an image: available formats: image/jpeg', 'image/png', 'image/bmp', 'image/gif'
      if (!['image/jpeg', 'image/png', 'image/bmp', 'image/gif'].includes(req.file.mimetype)) {
        throw new SnapSyncException(422, 'Unprocessable Entity');
      }

      // // check if the file is too big: max 8MB
      if (req.file.size > 1024 * 1024 * 8) throw new SnapSyncException(422, 'Unprocessable Entity');

      // // check size of the image: PROFILE_PICTURE_SIZE x PROFILE_PICTURE_SIZE
      let resizedImage = req.file.buffer;
      const size = sizeOf(req.file.buffer);
      if (size.width !== PROFILE_PICTURE_SIZE || size.height !== PROFILE_PICTURE_SIZE) {
        // Se le dimensioni non sono corrette, ridimensiona l'immagine
        resizedImage = await sharp(req.file.buffer).resize(PROFILE_PICTURE_SIZE).withMetadata().toBuffer();
      }

      // // calculate blurhash
      const pixels = await sharp(resizedImage).raw().toBuffer();
      // const blurHash = encode(new Uint8ClampedArray(pixels), PROFILE_PICTURE_SIZE, PROFILE_PICTURE_SIZE, 4, 4);

      // // upload to s3
      let s3Key = `profile-pictures/${req.user.id}/${uuidv4()}`;
      const url = await this.awsService.uploadFile(s3Key, resizedImage, req.file.mimetype);

      // // update user profile picture
      const data: UpdateProfilePictureDto = {
        profilePictureUrl: url,
        profilePictureBlurHash: null,
        profilePictureWidth: PROFILE_PICTURE_SIZE,
        profilePictureHeight: PROFILE_PICTURE_SIZE,
      };

      const updatedUser = await this.userService.updateProfilePicture(req.user.id, data);

      const profilePicture: UserProfilePicture = {
        url: updatedUser.profilePictureUrl,
        width: updatedUser.profilePictureWidth || PROFILE_PICTURE_SIZE,
        height: updatedUser.profilePictureHeight || PROFILE_PICTURE_SIZE,
        blurHash: updatedUser.profilePictureBlurHash || null,
      };

      res.status(200).json({ profilePicture: profilePicture, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  public removeProfilePicture = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      await this.userService.removeProfilePicture(req.user.id);

      res.status(200).json({ profilePicture: null, message: 'ok' });
    } catch (error) {
      next(error);
    }
  };

  private generateWebFormData = (
    user: User,
  ): {
    username: string;
    fullname: string;
    biography: string | null;
    profilePicture: UserProfilePicture | null;
  } => {
    const formData: {
      username: string;
      fullname: string;
      biography: string | null;
      profilePicture: UserProfilePicture | null;
    } = {
      username: user.username,
      fullname: user.fullname,
      biography: user.biography,
      profilePicture: null,
    };

    if (user.profilePictureUrl) {
      formData.profilePicture = {
        url: user.profilePictureUrl,
        width: user.profilePictureWidth || PROFILE_PICTURE_SIZE,
        height: user.profilePictureHeight || PROFILE_PICTURE_SIZE,
        blurHash: user.profilePictureBlurHash || null,
      };
    }

    return formData;
  };
}

export default AccountsController;
