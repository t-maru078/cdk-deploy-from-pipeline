import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { aws_codestarconnections as codestar_connections } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FrontEndResources } from '../resources/frontend-resources';

// CDK pipelines module を使って CI/CD Pipeline を構成する例
export class CdkPipelinesDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubConnection = new codestar_connections.CfnConnection(this, 'GithubConnection', {
      connectionName: 'CdkPipelinesConnection',
      providerType: 'GitHub',
    });

    const githubOwnerName = this.node.tryGetContext('githubOwnerName');
    const githubRepoName = this.node.tryGetContext('githubRepoName');

    const artifactBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const codePipeline = new codepipeline.Pipeline(this, 'CodePipeline', {
      pipelineName: 'CdkDeploymentPipeline',
      artifactBucket,
    });

    const pipeline = new pipelines.CodePipeline(this, 'CdkPipeline', {
      selfMutation: false,
      synthCodeBuildDefaults: {
        partialBuildSpec: codebuild.BuildSpec.fromObject({
          phases: {
            pre_build: {
              commands: `echo '{"githubOwnerName":"${githubOwnerName}","githubRepoName":"${githubRepoName}"}' >> cdk.context.json`,
            },
          },
        }),
      },
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.connection(`${githubOwnerName}/${githubRepoName}`, 'main', {
          connectionArn: githubConnection.ref,
        }),
        commands: ['npm i', 'npm run cdk synth'],
      }),
      codePipeline,
    });

    const frontendResources = new FrontEndResources(this, 'FrontedResources');

    pipeline.addStage(frontendResources, {
      stackSteps: [
        {
          stack: frontendResources.dbStack,
          changeSet: [new pipelines.ManualApprovalStep('ChangeSetApproval')],
        },
      ],
    });
  }
}
