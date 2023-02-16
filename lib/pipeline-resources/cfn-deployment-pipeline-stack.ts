import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { aws_codestarconnections as codestar_connections } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const DEPLOY_STACK_NAME = 'CognitoStack';
const CHANGE_SET_NAME = 'CognitoStackChangeSet';

// Deploy に CloudFormation を使った場合の例
export class CfnDeploymentPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubConnection = new codestar_connections.CfnConnection(this, 'GithubConnection', {
      connectionName: 'CfnPipelineConnection',
      providerType: 'GitHub',
    });

    const githubOwnerName = this.node.tryGetContext('githubOwnerName');
    const githubRepoName = this.node.tryGetContext('githubRepoName');

    const synthTemplateProject = new codebuild.PipelineProject(this, 'SynthTemplateProject', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('ci/code-build/synth-template.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        computeType: codebuild.ComputeType.SMALL,
      },
    });

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const cdkTemplateOutput = new codepipeline.Artifact('CdkTemplateOutput');

    const artifactBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: 'FetchSourceCode',
              owner: githubOwnerName,
              repo: githubRepoName,
              branch: 'main',
              connectionArn: githubConnection.ref,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'SynthCdkTemplate',
              project: synthTemplateProject,
              input: sourceOutput,
              outputs: [cdkTemplateOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
              actionName: 'CreateCfnChangeSet',
              adminPermissions: true,
              stackName: DEPLOY_STACK_NAME,
              changeSetName: CHANGE_SET_NAME,
              templatePath: cdkTemplateOutput.atPath('CognitoStack.template.json'),
              runOrder: 1
            }),
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ChangeSetReview',
              runOrder: 2,
            }),
            new codepipeline_actions.CloudFormationExecuteChangeSetAction({
              actionName: 'DeployResources',
              stackName: DEPLOY_STACK_NAME,
              changeSetName: CHANGE_SET_NAME,
              runOrder: 3,
            }),
          ],
        },
      ],
    });
  }
}
