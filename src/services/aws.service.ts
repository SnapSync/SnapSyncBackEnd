import { S3_ACCESS_KEY_ID, S3_BUCKET_NAME, S3_BUCKET_REGION, S3_CDN_URL, S3_SECRET_ACCESS_KEY } from '@/config';
import { SnapSyncException } from '@/exceptions/SnapSyncException';
import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  region: S3_BUCKET_REGION,
});

class AwsService {
  public async getSignedUrl(key: string): Promise<string> {
    let params: GetObjectCommandInput = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const url = await awsGetSignedUrl(s3, command, { expiresIn: 3600 });

    return url;
  }

  public async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const params: PutObjectCommandInput = {
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };
    const command = new PutObjectCommand(params);
    const dataS3: PutObjectCommandOutput = await s3.send(command);
    if (!dataS3.$metadata.httpStatusCode || dataS3.$metadata.httpStatusCode !== 200) throw new SnapSyncException(500, 'Internal Server Error');

    let url = `${S3_CDN_URL}/${key}`;

    return url;
  }
}

export default AwsService;
