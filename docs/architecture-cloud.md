# Cloud Architecture – AWS (Part C)

## Component Summary

| Layer          | Component                      | Purpose                                              |
|----------------|-------------------------------|------------------------------------------------------|
| DNS / Edge     | Route 53                      | DNS routing                                          |
| CDN            | CloudFront                    | Serves React SPA from S3; caches API responses       |
| Static hosting | S3                            | React build artifacts                                |
| Load balancing | ALB (Application Load Balancer)| HTTPS termination, routes to ECS services           |
| Compute        | ECS Fargate                   | Containerised microservices – no EC2 management      |
| Image registry | ECR                           | Docker images; scanned on push                       |
| Database       | RDS Aurora PostgreSQL         | Multi-AZ, automatic failover; one cluster per service|
| Cache          | ElastiCache (Redis)           | Future: query result cache for Requests search       |
| Messaging      | Amazon SQS                    | Durable async queue for Outbox events                |
| Document store | S3 (separate bucket)          | User-uploaded documents                              |
| Observability  | CloudWatch (Logs/Metrics/Alarms) | Centralised logs, dashboards, alerting            |
| CI/CD          | CodePipeline + CodeBuild      | Build → push ECR → deploy ECS (not in diagram)      |

## Scaling Strategy

- **ECS Fargate** – each service scales independently via CPU/request-count target-tracking.
- **RDS Aurora** – read replicas for Reporting and search-heavy workloads.
- **SQS** – scales automatically; no throughput provisioning needed.
- **ALB** – scales transparently.

## Key Decisions

| Decision              | Choice           | Alternative        | Reason                                          |
|-----------------------|------------------|--------------------|-------------------------------------------------|
| Compute               | ECS Fargate      | EKS / Lambda       | Simpler ops than EKS; better for long-lived APIs than Lambda |
| DB per service        | RDS Aurora       | Shared RDS         | Service autonomy; independent scaling & schema  |
| Messaging             | SQS              | Kafka / EventBridge| SQS is simpler; no cluster to manage            |
| SPA hosting           | S3 + CloudFront  | ECS-served         | Zero-compute cost for static files; global CDN  |
