// import * as cdk from 'aws-cdk-lib';
// import { Construct } from 'constructs';
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import * as ecs from "aws-cdk-lib/aws-ecs";
// import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
// import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
// import * as ecr from "aws-cdk-lib/aws-ecr"
// import { HttpAlbIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
// import * as fs from 'fs';
// import * as path from 'path';
// export const PREFIX = "eda-ecs";
// export class DevopsFirstAppStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // Define the path to the services directory
//     const servicesDir = path.join(__dirname, '../services');

//     // Read the services directory to get a list of service names
//     const services = fs.readdirSync(servicesDir).filter(file =>
//       fs.statSync(path.join(servicesDir, file)).isDirectory()
//     );

//     // Loop through each service directory and create an ECR repository

//     const vpc = new ec2.Vpc(this, "EdaVpc", {
//       ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
//       maxAzs: 2, // Default is all AZs in region
//       vpcName: `${PREFIX}-mvpc`,
//       restrictDefaultSecurityGroup: false
//     });

//     const cluster = new ecs.Cluster(this, "MultiImageCluster", {
//       vpc: vpc,
//       clusterName: `${PREFIX}-mcluster`
//     });

//     services.forEach(service => {
//       const ecrRepo = new ecr.Repository(this, `${service}Repository`, {
//         repositoryName: service.toLowerCase(), // ECR repository names must be lowercase
//         removalPolicy: cdk.RemovalPolicy.DESTROY, // Automatically delete the repo when the stack is deleted
//       });

//       // Create a load-balanced Fargate service and make it public
//       const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${service}-fargateService`, {
//         cluster: cluster, // Required
//         cpu: 256, // can be >= 256
//         serviceName: `${service}-service`,
//         loadBalancerName: `${service}-alb-eda`,
//         desiredCount: 2, // Default is 1
//         taskImageOptions: {
//           image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
//           environment: {
//             ENV_VAR_1: "value1",
//             ENV_VAR_2: "value2",
//           },
//           containerPort: 80
//         },
//         memoryLimitMiB: 512, // can be >= 512
//         publicLoadBalancer: true // can be set to false
//       });

//       // Add Scalling
//       const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 5, minCapacity: 1 });
//       scaling.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min
//       scaling.scaleOnMemoryUtilization("RamScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min

//       fargateService.targetGroup.configureHealthCheck({
//         path: "/"
//       })
//       const httpApi = new apigw2.HttpApi(this, `${service}-HttpApi`, { apiName: `${PREFIX}-api` });
//       httpApi.addRoutes({
//         path: "/",
//         methods: [apigw2.HttpMethod.GET],
//         integration: new HttpAlbIntegration(`${service}-AlbIntegration`, fargateService.listener)
//       })
//     });

//     // Create a load-balanced Fargate service and make it public
//     // const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "EdaFargateService", {
//     //   cluster: cluster, // Required
//     //   cpu: 256, // can be >= 256
//     //   serviceName: `${PREFIX}-service`,
//     //   loadBalancerName: `${PREFIX}-alb-eda`,
//     //   desiredCount: 2, // Default is 1
//     //   taskImageOptions: {
//     //     image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
//     //     environment: {
//     //       ENV_VAR_1: "value1",
//     //       ENV_VAR_2: "value2",
//     //     },
//     //     containerPort: 80
//     //   },
//     //   memoryLimitMiB: 512, // can be >= 512
//     //   publicLoadBalancer: true // can be set to false
//     // });

//     // // Add Scalling
//     // const scaling = service.service.autoScaleTaskCount({ maxCapacity: 5, minCapacity: 1 });
//     // scaling.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min
//     // scaling.scaleOnMemoryUtilization("RamScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min

//     // service.targetGroup.configureHealthCheck({
//     //   path: "/"
//     // })
//     // const httpApi = new apigw2.HttpApi(this, "HttpApi", { apiName: `${PREFIX}-api` });
//     // httpApi.addRoutes({
//     //   path: "/",
//     //   methods: [apigw2.HttpMethod.GET],
//     //   integration: new HttpAlbIntegration("AlbIntegration", service.listener)
//     // })
//   }
// }

// // export class RepositoryStack extends cdk.Stack {
// //   repository: ecr.Repository;

// //   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
// //     super(scope, id, props);

// //     const repository = new ecr.Repository(this, "Repository", {
// //       repositoryName: `${PREFIX}-repository`,
// //       removalPolicy: cdk.RemovalPolicy.DESTROY,
// //     });
// //     this.repository = repository;
// //   }
// // }

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as fs from 'fs';
import * as path from 'path';

export class DevopsFirstAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the path to the microservices directory
    const servicesDir = path.join(__dirname, '../services');

    // Read the services directory to get a list of service names
    const services = fs.readdirSync(servicesDir).filter(file =>
      fs.statSync(path.join(servicesDir, file)).isDirectory()
    );

    // Create a VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2,
      natGateways: 1, // Ensure NAT gateway for private subnets
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      vpc: vpc,
    });

    // Loop through each service directory and create an ECR repository and ECS Fargate service
    services.forEach(service => {
      // Create an ECR repository for each service
      const ecrRepo = new ecr.Repository(this, `${service}Repository`, {
        repositoryName: service.toLowerCase(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Optionally, add lifecycle rules to manage old images
      ecrRepo.addLifecycleRule({
        tagPrefixList: ['prod'],
        maxImageCount: 10,
      });

      ecrRepo.addLifecycleRule({
        maxImageAge: cdk.Duration.days(30),
      });

      // Create a security group for the Fargate service
      const serviceSecurityGroup = new ec2.SecurityGroup(this, `${service}SecurityGroup`, {
        vpc: vpc,
        allowAllOutbound: true,
      });
      serviceSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');

      // Create a Fargate service for each service
      const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${service}FargateService`, {
        cluster: cluster, // Required
        cpu: 256, // Default is 256
        desiredCount: 1, // Default is 1
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(ecrRepo), // Pull the image from the respective ECR repository
          containerPort: 80,
        },
        memoryLimitMiB: 512, // Default is 512
        publicLoadBalancer: true, // Default is true
        securityGroups: [serviceSecurityGroup],
      });

      // Set up Auto Scaling based on CPU utilization
      const scaling = fargateService.service.autoScaleTaskCount({
        maxCapacity: 5,
      });
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
      });

      // Output the service URL and ECR repository URI
      new cdk.CfnOutput(this, `${service}ServiceUrl`, {
        value: fargateService.loadBalancer.loadBalancerDnsName,
        description: `Load balancer URL for the ${service} service`,
      });

      new cdk.CfnOutput(this, `${service}RepositoryUri`, {
        value: ecrRepo.repositoryUri,
        description: `URI for the ${service} ECR repository`,
      });
    });
  }
}

// const app = new cdk.App();
// new MultiEcrEcsStack(app, 'MultiEcrEcsStack');
// app.synth();
