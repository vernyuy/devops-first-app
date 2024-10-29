import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
import * as ecr from "aws-cdk-lib/aws-ecr"
import { HttpAlbIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export const PREFIX = "eda-ecs";
export class DevopsFirstAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyApp", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // Default is all AZs in region
      vpcName: `${PREFIX}-mvpc`,
      restrictDefaultSecurityGroup: false
    });

    const cluster = new ecs.Cluster(this, "MultiImageCluster", {
      vpc: vpc,
      clusterName: `${PREFIX}-cluster`
    });

      const ecrRepo = ecr.Repository.fromRepositoryName(this, `${PREFIX}-RepositoryService`, `${PREFIX}`)

      // Create a load-balanced Fargate service and make it public
      const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${PREFIX}-fargateService`, {
        cluster: cluster, // Required
        cpu: 256, // can be >= 256
        serviceName: `${PREFIX}`,
        loadBalancerName: `${PREFIX}`,
        desiredCount: 2, // Default is 1
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
          containerPort: 80
        },
        memoryLimitMiB: 512, // can be >= 512
        publicLoadBalancer: true // can be set to false
      });

      // Add Scalling
      const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 5, minCapacity: 1 });
      scaling.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min
      scaling.scaleOnMemoryUtilization("RamScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min

      fargateService.targetGroup.configureHealthCheck({
        path: "/"
      })
      const httpApi = new apigw2.HttpApi(this, `${PREFIX}-HttpApi`, { apiName: `${PREFIX}-api` });
      httpApi.addRoutes({
        path: "/",
        methods: [apigw2.HttpMethod.GET],
        integration: new HttpAlbIntegration(`${PREFIX}-AlbIntegration`, fargateService.listener)
      })
  }
}

export class RepositoryStack extends cdk.Stack {
  repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

      new ecr.Repository(this, `${PREFIX}Repository`, {
        repositoryName: 'myapp', // ECR repository names must be lowercase
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete the repo when the stack is deleted
      });
  }
}
