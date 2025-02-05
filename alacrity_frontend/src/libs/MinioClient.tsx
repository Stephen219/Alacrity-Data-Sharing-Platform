import { Client as MinioClient } from 'minio';

// Create a MinIO client instance
const minioClient = new MinioClient({
  endPoint: 'edc1-31-205-218-136.ngrok-free.app',
  port: 9000,  // default MinIO port, change if necessary
  useSSL: false, // Use SSL if MinIO server is configured for HTTPS
  accessKey: 'minioaddmin',
  secretKey: 'minioaddmin',
});

export { minioClient };
