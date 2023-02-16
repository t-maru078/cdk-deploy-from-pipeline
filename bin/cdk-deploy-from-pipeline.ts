#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkCliDeploymentPipelineStack } from '../lib/pipeline-resources/cdk-cli-deployment-pipeline-stack';
import { CfnDeploymentPipelineStack } from '../lib/pipeline-resources/cfn-deployment-pipeline-stack';
import { CognitoStack } from '../lib/resources/cognito-stack';
import { CdkPipelinesDeploymentStack } from '../lib/pipeline-resources/cdk-pipelines-deployment-stack';

const app = new cdk.App();
new CdkCliDeploymentPipelineStack(app, 'CdkCliDeploymentPipelineStack');
new CfnDeploymentPipelineStack(app, 'CfnDeploymentPipelineStack');
new CognitoStack(app, 'CognitoStack');

new CdkPipelinesDeploymentStack(app, 'CdkPipelinesDeploymentStack');

app.synth();
