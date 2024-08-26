import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
import * as ecr from "aws-cdk-lib/aws-ecr"
import { HttpAlbIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as fs from 'fs';
import * as path from 'path';
export const PREFIX = "eda-ecs";
export class DevopsFirstAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the path to the services directory
    const servicesDir = path.join(__dirname, '../services');

    // Read the services directory to get a list of service names
    const services = fs.readdirSync(servicesDir).filter(file => 
      fs.statSync(path.join(servicesDir, file)).isDirectory()
    );

    // Loop through each service directory and create an ECR repository

    const vpc = new ec2.Vpc(this, "EdaVpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // Default is all AZs in region
      vpcName: `${PREFIX}-vpc`,
      restrictDefaultSecurityGroup: false
    });

    const cluster = new ecs.Cluster(this, "EdaCluster", {
      vpc: vpc,
      clusterName: `${PREFIX}-cluster`
    });

    services.forEach(service => {
      const ecrRepo = new ecr.Repository(this, `${service}Repository`, {
        repositoryName: service.toLowerCase(), // ECR repository names must be lowercase
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete the repo when the stack is deleted
      });

          // Create a load-balanced Fargate service and make it public
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "EdaFargateService", {
      cluster: cluster, // Required
      cpu: 256, // can be >= 256
      serviceName: `${PREFIX}-service`,
      loadBalancerName: `${PREFIX}-alb-eda`,
      desiredCount: 2, // Default is 1
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
        environment: {
          ENV_VAR_1: "value1",
          ENV_VAR_2: "value2",
        },
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
    const httpApi = new apigw2.HttpApi(this, "HttpApi", { apiName: `${PREFIX}-api` });
    httpApi.addRoutes({
      path: "/",
      methods: [apigw2.HttpMethod.GET],
      integration: new HttpAlbIntegration("AlbIntegration", fargateService.listener)
    })
    });

    // Create a load-balanced Fargate service and make it public
    // const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "EdaFargateService", {
    //   cluster: cluster, // Required
    //   cpu: 256, // can be >= 256
    //   serviceName: `${PREFIX}-service`,
    //   loadBalancerName: `${PREFIX}-alb-eda`,
    //   desiredCount: 2, // Default is 1
    //   taskImageOptions: {
    //     image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
    //     environment: {
    //       ENV_VAR_1: "value1",
    //       ENV_VAR_2: "value2",
    //     },
    //     containerPort: 80
    //   },
    //   memoryLimitMiB: 512, // can be >= 512
    //   publicLoadBalancer: true // can be set to false
    // });

    // // Add Scalling
    // const scaling = service.service.autoScaleTaskCount({ maxCapacity: 5, minCapacity: 1 });
    // scaling.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min
    // scaling.scaleOnMemoryUtilization("RamScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min

    // service.targetGroup.configureHealthCheck({
    //   path: "/"
    // })
    // const httpApi = new apigw2.HttpApi(this, "HttpApi", { apiName: `${PREFIX}-api` });
    // httpApi.addRoutes({
    //   path: "/",
    //   methods: [apigw2.HttpMethod.GET],
    //   integration: new HttpAlbIntegration("AlbIntegration", service.listener)
    // })
  }
}

// export class RepositoryStack extends cdk.Stack {
//   repository: ecr.Repository;

//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     const repository = new ecr.Repository(this, "Repository", {
//       repositoryName: `${PREFIX}-repository`,
//       removalPolicy: cdk.RemovalPolicy.DESTROY,
//     });
//     this.repository = repository;
//   }
// }