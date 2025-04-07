import os
import boto3
import botocore

S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

class S3Client:
    client = None

    def get_client():
        if S3Client.client is not None:
            return S3Client.client
        S3Client.client = boto3.client(
            "s3",
            endpoint_url=f"{S3_ENDPOINT}",
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
        )

        try:
            S3Client.client.head_bucket(Bucket=S3_BUCKET_NAME)
        except botocore.exceptions.ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                S3Client.client.create_bucket(Bucket=S3_BUCKET_NAME)
        return S3Client.client
    
    def put(file, file_name, content_type="application/octet-stream"):
        client = S3Client.get_client()
        client.upload_fileobj(file, S3_BUCKET_NAME, file_name, ExtraArgs={"ContentType": content_type})
        return file_name
        #return f"{S3_ENDPOINT}/{S3_BUCKET_NAME}/{file_name}"
    
    def get_url_from_filename(file_name):
        return f"{S3_ENDPOINT}/{S3_BUCKET_NAME}/{file_name}"
    
    def delete(file_name):
        """Delete an object from S3 bucket.
        
        Args:
            file_name: The key/name of the file in the S3 bucket
            
        Returns:
            True if the file was successfully deleted, False otherwise
        """
        try:
            client = S3Client.get_client()
            client.delete_object(Bucket=S3_BUCKET_NAME, Key=file_name)
            return True
        except Exception as e:
            print(f"Error deleting file from S3: {str(e)}")
            return False