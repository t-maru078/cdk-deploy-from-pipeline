#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkDeploymentPipelineStack } from '../lib/pipeline-resources/cdk-deployment-pipeline-stack';
import { CfnDeploymentPipelineStack } from '../lib/pipeline-resources/cfn-deployment-pipeline-stack';
import { CognitoStack } from '../lib/resources/cognito-stack';

const app = new cdk.App();
new CdkDeploymentPipelineStack(app, 'CdkDeploymentPipelineStack');
new CfnDeploymentPipelineStack(app, 'CfnDeploymentPipelineStack');
new CognitoStack(app, 'CognitoStack');

app.synth();
