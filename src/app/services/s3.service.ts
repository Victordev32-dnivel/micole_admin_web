import { Injectable } from '@angular/core';
import { S3 } from 'aws-sdk';
import { Buffer } from 'buffer';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class S3Service {
    private s3: S3;
    private readonly BUCKET_NAME = environment.aws.bucketName;

    constructor() {
        // Polyfill for Buffer if not present
        if (typeof (window as any).Buffer === 'undefined') {
            (window as any).Buffer = Buffer;
        }

        this.s3 = new S3({
            accessKeyId: environment.aws.accessKeyId,
            secretAccessKey: environment.aws.secretAccessKey,
            region: environment.aws.region
        });
    }

    async uploadFile(file: File, folder: string = 'colegios'): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Content = reader.result as string;
                const base64Data = base64Content.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');

                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(2);
                const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const fileName = `${folder}/${timestamp}_${randomId}.${fileExtension}`;

                const contentType = file.type || 'image/jpeg';

                const params = {
                    Bucket: this.BUCKET_NAME,
                    Key: fileName,
                    Body: buffer,
                    ContentType: contentType,
                };

                this.s3.upload(params, (err: any, data: any) => {
                    if (err) {
                        console.error('Error uploading to S3:', err);
                        reject(err);
                    } else {
                        resolve(data.Location);
                    }
                });
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    }
}
