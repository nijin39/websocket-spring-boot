import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as ecrdeploy from "cdk-ecr-deployment";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import path = require("path");
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class AoDv2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //---------- Websocket with lambda

    const webSocketApi = new apigatewayv2.WebSocketApi(this, "websocket-aod");

    const wsLambda = new cdk.aws_lambda.Function(this, "wsLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
      code: cdk.aws_lambda.Code.fromAsset("lambda"),
      handler: "backend.handler",
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        WS_API_ID: webSocketApi.apiId,
      },
    });

    const stage = new apigatewayv2.WebSocketStage(this, "devStage", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    webSocketApi.addRoute("sendmessage", {
      integration: new WebSocketLambdaIntegration(
        "SendMessageIntegration",
        wsLambda
      ),
    });

    wsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:execute-api:*:*:${webSocketApi.apiId}/dev/*/*`],
        actions: ["execute-api:ManageConnections", "execute-api:Invoke"],
      })
    );

    //---------- END Websocket with lambda

    //---------- Docker Setting
    const image = new DockerImageAsset(this, "DockerFileAsset", {
      directory: path.join(__dirname, "../springboot-backend"),
      file: "Dockerfile",
      platform: Platform.LINUX_AMD64,
    });

    const ecr = new cdk.aws_ecr.Repository(this, "sprinb-boot-ecr", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
      repositoryName: "springboot-backend",
      imageTagMutability: cdk.aws_ecr.TagMutability.MUTABLE,
    });

    new ecrdeploy.ECRDeployment(this, "DeployDockerImage", {
      src: new ecrdeploy.DockerImageName(image.imageUri),
      dest: new ecrdeploy.DockerImageName(
        `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/springboot-backend:202308070936`
      ),
    });
    //---------- End Docker Setting

    //---------- VPC Setting
    const vpc = new ec2.Vpc(this, "aod-vpc", {
      maxAzs: 2, // 가용 영역 최대 2개
      natGateways: 1, // NAT Gateway 1개
    });
    ///---------- End VPC Setting

    //---------- ECS Cluster Setting
    const cluster = new ecs.Cluster(this, "aod-cluster", {
      vpc: vpc,
      clusterName: "AODCluster", // 클러스터 이름
    });
    //---------- End ECS Cluster Setting

    //---------- API Gateway Setting
    const api = new apigwv2.CfnApi(this, "wstest-apigw", {
      name: "WebSocketApi",
      protocolType: "WEBSOCKET",
      routeSelectionExpression: "$request.body.action",
    });
    //---------- End API Gateway Setting

    //---------- ECS Task Setting
    const policyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ["execute-api:Invoke", "execute-api:ManageConnections"],
          resources: ["arn:aws:execute-api:*:*:96lx4dtud1/dev/*/*"],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    // Task에 할당할 IAM 역할을 생성합니다.
    const taskRole = new iam.Role(this, "AODBackendTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        ApiGatewayPolicy: policyDocument, // 정책 문서를 인라인 정책으로 추가합니다.
      },
    });

    const lb_fargate_service =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "AODBackendService",
        {
          cluster: cluster,
          circuitBreaker: {
            rollback: true,
          },
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(ecr, "202308070936"),
            containerPort: 8080,
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: id,
              logRetention: RetentionDays.ONE_YEAR,
            }),
            taskRole: taskRole,
            environment: {
              API_ENDPOINT: `https://${api.ref}.execute-api.${
                cdk.Stack.of(this).region
              }.amazonaws.com`,
            },
          },
          desiredCount: 1,
          memoryLimitMiB: 512,
          publicLoadBalancer: true,
        }
      );

    lb_fargate_service.targetGroup.configureHealthCheck({
      path: "/health",
    });
    //---------- End ECS Task Setting

    //---------- API Route / Integration Setting
    const integration = new apigwv2.CfnIntegration(
      this,
      `connect-lambda-integration`,
      {
        apiId: api.ref,
        integrationType: "HTTP_PROXY",
        integrationUri: `http://${lb_fargate_service.loadBalancer.loadBalancerDnsName}/ws-delay`,
        integrationMethod: "GET",
        requestParameters: {
          "integration.request.header.connectionId": "context.connectionId",
        },
      }
    );
    integration.node.addDependency(api);

    new apigwv2.CfnRoute(this, `connect-route`, {
      apiId: api.ref,
      routeKey: "wsdelay", // ＊１
      authorizationType: "NONE",
      target: "integrations/" + integration.ref,
    });

    const deployment = new apigwv2.CfnDeployment(this, `dev-deployment`, {
      apiId: api.ref,
    });

    new apigwv2.CfnStage(this, `dev-stage`, {
      apiId: api.ref,
      autoDeploy: true,
      deploymentId: deployment.ref,
      stageName: "dev",
    });
    //---------- End API Route / Integration Setting

    new cdk.CfnOutput(this, "wsendpoint", {
      value: `wss://${api.ref}.execute-api.${
        cdk.Stack.of(this).region
      }.amazonaws.com/${stage.stageName}`,
      description: "websocket",
    });
  }
}
