import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { aws_codestarconnections as codestar_connections } from 'aws-cdk-lib';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

// Deploy に cdk コマンド を使った場合の例
export class CdkCliDeploymentPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubConnection = new codestar_connections.CfnConnection(this, 'GithubConnection', {
      connectionName: 'CdkCliPipelineConnection',
      providerType: 'GitHub',
    });

    const githubOwnerName = this.node.tryGetContext('githubOwnerName');
    const githubRepoName = this.node.tryGetContext('githubRepoName');

    const adminRole = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });
    adminRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

    const cdkDeployProject = new codebuild.PipelineProject(this, 'CdkDeployProject', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('ci/code-build/deploy-stack.yml'),
      role: adminRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        computeType: codebuild.ComputeType.SMALL,
      },
    });

    const sourceOutput = new codepipeline.Artifact('SourceOutput');

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
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployResources',
              project: cdkDeployProject,
              input: sourceOutput,
            }),
          ],
        },
      ],
    });
  }
}
