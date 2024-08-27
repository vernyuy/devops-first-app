#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevopsFirstAppStack } from '../lib/devops-first-app-stack'

const app = new cdk.App();

// const repoStack = new RepositoryStack(app, "repoStackName", {})
new DevopsFirstAppStack(app, 'DevopsAppStack',  {});