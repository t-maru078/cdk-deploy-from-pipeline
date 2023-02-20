/** pipelines module を使ってデプロイする際に使用するリソース定義 */

import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

class CognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new cognito.UserPool(this, 'UserPool', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}

class DbStack extends cdk.Stack {
  public readonly table: cdk.aws_dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new cdk.aws_dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });
  }
}

export class FrontendResources extends cdk.Stage {
  public readonly dbStack: DbStack;
  public readonly cognitoStack: CognitoStack;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    this.dbStack = new DbStack(this, 'DbStack');
    this.cognitoStack = new CognitoStack(this, 'CognitoStack');
  }
}
