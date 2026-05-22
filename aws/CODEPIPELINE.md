# AWS CodePipeline Deployment

This deployment path is for the branch flow:

```text
Developer pushes to develop
  -> CodePipeline starts
  -> CodeBuild builds api and web Docker images
  -> CodeBuild pushes both images to ECR
  -> CodePipeline deploys the ECS service
  -> ECS pulls the new images
  -> The new Fargate task starts
  -> The application is live
```

This is the production deployment path for the repository.

## Recommended AWS Shape

- One CodePipeline triggered by pushes to `develop`.
- One CodeBuild project using the repository root `buildspec.yml`.
- Two ECR repositories:
  - `tile-game-api`
  - `tile-game-web`
- One ECS Fargate task definition with two containers:
  - `api`, port `3001`
  - `web`, port `3000`
- One ECS service for the task.
- One Application Load Balancer:
  - default route forwards to the `web` target group on port `3000`
  - `/api/*` forwards to the `api` target group on port `3001`
- External MongoDB, supplied to ECS through SSM Parameter Store or Secrets Manager.

Using one ECS task with both containers lets the standard CodePipeline ECS deploy action update both images from one `imagedefinitions.json` artifact.

## One-Time AWS Setup Checklist

Create the ECR repositories:

```bash
aws ecr create-repository --repository-name tile-game-api
aws ecr create-repository --repository-name tile-game-web
```

Create the CloudWatch log group used by the ECS task:

```bash
aws logs create-log-group --log-group-name /ecs/tile-game
```

Create or choose:

```text
VPC/subnets/security groups
ECS cluster
Application Load Balancer
web target group on port 3000
api target group on port 3001
ECS task execution role
ECS task role
CodeBuild service role
CodePipeline service role
```

Register a real task definition from `aws/ecs-task-definition.example.json` after replacing every `<region>`, `<account-id>`, and app domain placeholder.

Create an ECS Fargate service from that task definition. Attach both containers to the load balancer:

```text
web container -> web target group, container port 3000
api container -> api target group, container port 3001
```

Create a CodeBuild project:

```text
Source: same repository as CodePipeline source artifact
Buildspec: buildspec.yml
Environment: Linux container with Docker support
Privileged mode: enabled
```

Create a CodePipeline:

```text
Source stage: GitHub/CodeStar connection, branch develop
Build stage: CodeBuild project
Deploy stage: ECS deploy action
```

## Repository Files

- `buildspec.yml` builds and pushes both Docker images, then writes `imagedefinitions.json`.
- `aws/ecs-task-definition.example.json` is a starting task definition. Replace placeholders before registering it.
- `apps/web/Dockerfile` accepts `NEXT_PUBLIC_API_URL` as a build argument because Next.js public env values are baked during `next build`.

## CodeBuild Settings

Use a Linux CodeBuild image with Docker available, and enable privileged mode.

Required or recommended environment variables:

```text
AWS_DEFAULT_REGION      AWS region, for example us-east-1
ECR_API_REPOSITORY     Defaults to tile-game-api
ECR_WEB_REPOSITORY     Defaults to tile-game-web
NEXT_PUBLIC_API_URL    Public API base URL without /api, for example https://app.example.com
IMAGE_TAG_ALIAS        Defaults to develop-latest
```

`AWS_ACCOUNT_ID` and `IMAGE_TAG` are optional. If omitted, the build derives the account from STS and uses the commit SHA as the immutable image tag.

For same-origin ALB routing, set:

```text
NEXT_PUBLIC_API_URL=
```

For separate API and web hostnames, set:

```text
NEXT_PUBLIC_API_URL=https://api.example.com
```

The frontend client appends `/api` automatically.

## CodeBuild IAM Permissions

The CodeBuild service role needs permissions like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": [
        "arn:aws:ecr:<region>:<account-id>:repository/tile-game-api",
        "arn:aws:ecr:<region>:<account-id>:repository/tile-game-web"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
```

## ECS Runtime Configuration

Store MongoDB as a secure parameter or secret:

```bash
aws ssm put-parameter \
  --name /tile-game/prod/MONGODB_URI \
  --type SecureString \
  --value 'mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/tile-game?appName=Cluster0'
```

The ECS task execution role needs permission to read that parameter and write logs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameters"],
      "Resource": "arn:aws:ssm:<region>:<account-id>:parameter/tile-game/prod/MONGODB_URI"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:<region>:<account-id>:log-group:/ecs/tile-game:*"
    }
  ]
}
```

Set the API container environment:

```text
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://<your-app-domain-or-alb-dns-name>
```

## CodePipeline ECS Deploy Action

Configure the ECS deploy stage to use:

```text
Cluster name:       <your-cluster>
Service name:       <your-service>
Image definitions:  imagedefinitions.json
```

The ECS container names must be exactly:

```text
api
web
```

Those names match both `buildspec.yml` and `aws/ecs-task-definition.example.json`.

## Health Checks

Use these target group health check paths:

```text
web target group: /
api target group: /api/health
```

After deployment:

```bash
curl https://<your-app-domain-or-alb-dns-name>/
curl https://<your-app-domain-or-alb-dns-name>/api/health
```
