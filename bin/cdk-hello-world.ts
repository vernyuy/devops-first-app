import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevopsFirstAppStack, RepositoryStack } from '../lib/devops-first-app-stack'

const app = new cdk.App();

const repoStack = new RepositoryStack(app, "repoStackNameTest", {})
new DevopsFirstAppStack(app, 'DevopsAppStack',  {});