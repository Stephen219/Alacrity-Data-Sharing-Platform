# MinIO Object Storage Wiki
Author(S): [Mahi S](https://git.cardiff.ac.uk/c2051028) , [Kariuki S](https://git.cardiff.ac.uk/c22067364) and [Gikenyi C](https://git.cardiff.ac.uk/c22077065)

This wiki provides a comprehensive overview of our decision to use MinIO as the object storage solution for our project, including the rationale, configuration, deployment procedures, challenges, and troubleshooting steps. It serves as a detailed reference for developers, system administrators, and stakeholders.

## Table of Contents
1. [Introduction](#introduction)
2. [Why We Chose MinIO](#why-we-chose-minio)
3. [Python Integration Guide](#python-integration-guide)
4. [Deployment Procedures](#deployment-procedures)
5. [Challenges & Downsides](#challenges--downsides)
6. [Troubleshooting](#troubleshooting)
7. [Development Hosting on Cardiff University OpenStack](#development-hosting-on-cardiff-university-openstack)
8. [Conclusion](#conclusion)

---

## Introduction
For our project, we required an **object storage** solution to store documents, opting against keeping files directly on the server filesystem. This decision was driven by the need to **simulate a real production environment**, ensuring scalability, security, and compatibility with cloud-based workflows. After evaluating options, we selected **MinIO**, an open-source, **S3-compatible object storage** system, to meet these needs.

---

## Why We Chose MinIO
We selected MinIO for the following reasons:

1. **Amazon S3 API Compatibility**  
   - MinIO offers full compatibility with the Amazon S3 API, enabling seamless integration with tools, libraries, and services that support S3 during production. This ensures flexibility for future migrations to AWS S3 or other S3-compatible systems without significant refactoring. 
   
2. **Self-Hosted & Open-Source**  
   - Being open-source, MinIO allows us to host it on the schools infrastructure ([Cardiff University's OpenStack](https://cscloud.cf.ac.uk/auth/login/?next=/) during development) at no additional cost, avoiding vendor lock-in and providing full control over data and security policies.

3. **Decoupled Storage Architecture**  
   - Storing files in object storage rather than on the server decouples storage from compute, enhancing resilience, scalability, and maintainability while reducing server overload risks.

4. **Security & Encryption**  
   - MinIO supports would enable us to store stored encrypted data at rest, ensuring data security and compliance with data protection regulations.

5. **High Availability & Scalability**  
   - MinIO's support for **distributed deployments** and **erasure coding** enables horizontal scaling and data redundancy, making it suitable for production use.

6. **Lightweight & High Performance**  
   - Designed to be lightweight and optimized, MinIO performs well in both development and production environments.

### Why Object Storage Over Server Storage?
- **Production Simulation**: In production, documents are typically stored in scalable, distributed systems rather than a single server's filesystem. MinIO replicates this setup.
- **Scalability**: Object storage supports horizontal scaling, unlike traditional filesystems.
- **Resilience**: Separating storage from the application server improves fault tolerance.

---

## Python Integration Guide

### Configuration Settings
To connect to MinIO from your Python application, you need to update your settings file with the following configuration:

```python
# settings.py
MINIO_URL = "http://10.72.98.137:9000"
MINIO_ACCESS_KEY = "admin"
MINIO_SECRET_KEY = "Notgood1"
MINIO_BUCKET_NAME = "alacrity"
```

### Initializing the MinIO Client
To initialize and use the MinIO client in your Python code:

```python
from minio import Minio

# Create a MinIO client instance
minio_client = Minio(
    endpoint="10.72.98.137:9000",
    access_key="admin",
    secret_key="Notgood1",
    secure=False  # Set to True if using HTTPS
)

# Reference the bucket
BUCKET = MINIO_BUCKET_NAME
```

### Basic MinIO Operations

#### Uploading Files to MinIO
Example of uploading a file to MinIO:

```python
import io
import uuid

# Generate a unique ID
def generate_id():
    return str(uuid.uuid4())

# Upload a file to MinIO
def upload_file(file_data, filename):
    # Define the file path in the bucket
    file_key = f"files/{filename}"
    
    # Upload to MinIO
    minio_client.put_object(
        bucket_name=BUCKET,
        object_name=file_key,
        data=io.BytesIO(file_data),
        length=len(file_data)
    )
    
    # Generate file URL
    file_url = f"{MINIO_URL}/{BUCKET}/{file_key}"
    
    return file_url
```

#### Checking if a Bucket Exists
```python
def ensure_bucket_exists(bucket_name):
    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)
```

#### Downloading Objects from MinIO
```python
def download_object(bucket_name, object_name, file_path):
    minio_client.fget_object(bucket_name, object_name, file_path)
```

#### Listing Objects in a Bucket
```python
def list_objects(bucket_name, prefix=None):
    objects = []
    object_list = minio_client.list_objects(bucket_name, prefix=prefix, recursive=True)
    for obj in object_list:
        objects.append(obj.object_name)
    return objects
```

#### Removing Objects
```python
def remove_object(bucket_name, object_name):
    minio_client.remove_object(bucket_name, object_name)
```

For more detailed examples and advanced operations, refer to the [MinIO Python Client API Documentation](https://docs.min.io/docs/python-client-api-reference.html).

---

## Deployment Procedures
During developeent, we used a self hosted MinIO instance on Cardiff University's OpenStack. The vm was a Rhel 

### 1. Manual Installation on Linux Server
- **Note**: For RPM or DEB-based systems, do refer to the [MinIO Installation Guide](https://docs.min.io/docs/minio-quickstart-guide.html).
```bash
# Download MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
chmod +x /usr/local/bin/minio

# Create storage directory
sudo mkdir -p /mnt/data
sudo chmod 777 /mnt/data  # Adjust permissions as needed technically 777 is not secure

# Add the following lines   do not forget your password!!!!!!!!!!!!!!!!!!!!

echo "MINIO_ROOT_USER=admin" | sudo tee -a /etc/default/minio
echo "MINIO_ROOT_PASSWORD=goodunhackablepass" | sudo tee -a /etc/default/minio

# Create MinIO systemd service
sudo tee /etc/systemd/system/minio.service <<EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/minio server /mnt/data --console-address ':9001'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start and enable MinIO
sudo systemctl daemon-reload
sudo systemctl enable --now minio
# Check status
systemctl status minio
# or 
curl localhost:9000/minio/health/ready 
```

- **Access**: API at `http://<server-ip>:9000`, Console at `http://<server-ip>:9001`.


### 2. Running MinIO in Docker
 note : not tested
```bash
docker run -d -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=StrongPassword123" \
  -v /mnt/data:/data \
  minio/minio server /data --console-address ":9001"
```

- **Access**: API at `http://<host-ip>:9000`, Console at `http://<host-ip>:9001`.

### 3. Terraform Deployment cloud

to deploy it on any cloud provider, you can use terraform as the infrastructure as code to deploy the instance and install minio on it. Ensure you allow traffic in port 9000 and 9001 in the security group.
- **Note**: For RPM or DEB-based systems, refer to the [MinIO Installation Guide](https://docs.min.io/docs/minio-quickstart-guide.html).

```hcl
ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict in production
  }
  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict in production
  }
  ingress {
    from_port   = 9001
    to_port     = 9001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict in production
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
```


- **Deployment Steps**:
  1. Run `terraform init` to initialize.
  2. Run `terraform plan` to review changes.
  3. Run `terraform apply` and confirm with `yes`.
  4. Access MinIO: API at `http://<ec2-public-ip>:9000`, Console at `http://<ec2-public-ip>:9001`.

---

## Challenges & Downsides
While MinIO aligns with our goals, it has some limitations and trade-offs:

1. **Slower Upload/Download Speeds**  
   - **Issue**: Compared to local filesystem storage, MinIO's performance depends on network bandwidth and disk I/O. On a `t2.micro` instance, latency is noticeable.
   - **Trade-Off**: We prioritized scalability and production realism over raw speed. Distributed deployments could improve this, but resource constraints limited us to a single node.


2. **Configuration & Maintenance Overhead**  
   - **Issue**: MinIO requires manual setup, security configuration, and maintenance, unlike fully managedAWS S3.
   - **Trade-Off**: This was acceptable for development and self-hosting benefits.

3. **Limited Built-In Monitoring**  
   - **Issue**: MinIO lacks advanced monitoring; tools like Prometheus and Grafana are needed for metrics. 
   we also did try to check on webhooks to implement event driven development but it was not successful.
   - **Trade-Off**: We deferred advanced monitoring for simplicity during development.

6. **Encryption Overhead**  
   - **Benefit**: Server-side encryption secures data.
   - **Issue**: Adds slight latency and CPU usage.
   - **Trade-Off**: Security outweighed minor performance impacts.

### Foregone Alternatives
- **Local Filesystem**: Faster but lacks scalability and production realism.
- **AWS S3**: Fully managed but costly and impractical for OpenStack-based development.

---

## Troubleshooting
Common issues and their fixes:

| **Error**                             | **Solution**                                                                 |
|---------------------------------------|------------------------------------------------------------------------------|
| `ERROR Unable to initialize storage backend` | Ensure `/mnt/data` exists and is writable (`sudo chown -R minio-user:minio-user /mnt/data`). |
| `Access Denied`                       | Verify `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` match in `/etc/default/minio` or Docker env vars. |
| `503 Service Unavailable`             | Check MinIO status (`systemctl status minio`) and ensure it's running.       |
| `Connection Refused` on 9000/9001     | Confirm security group/firewall rules allow traffic (`sudo ufw allow 9000`). |
| `Out of Memory Errors`                | Upgrade instance size or implement horizontal scaling.                      |

---

## Development Hosting on Cardiff University OpenStack
During development, we hosted MinIO on **Cardiff University's OpenStack** platform ([Cardiff OpenStack Documentation](https://www.cardiff.ac.uk/research-computing/openstack)).


---

## Conclusion
MinIO proved to be a **cost-effective, scalable, and S3-compatible** solution for our object storage needs. Its open-source nature and self-hosting capabilities aligned with our development goals, while its encryption and scalability features prepared us for production. Despite trade-offs like slower speeds and manual configuration, the benefits of flexibility, security, and production simulation outweighed the downsides. The deployment options (Linux, Docker, Terraform) and troubleshooting guidance ensure maintainability.

### Future Improvements
- Deploy MinIO in **distributed mode** for redundancy and performance.

- Enhance monitoring with **Prometheus and Grafana**.



---
*Last Updated: March 1, 2025*