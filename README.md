# cdk-deploy-from-pipeline

CDK を使って定義されたリソースを CodePipeline 上から AWS に自動デプロイするサンプルです。
以下の 2 パターンの Pipeline が定義されているため必要に応じて使い分けてください。

- Pipeline からのデプロイ時に CloudFormation を使うパターン

  ![cloud-formation-pattern](./assets//cfn-pattern.jpg)

- Pipeline からのデプロイ時に cdk コマンドを使うパターン

  ![cdk-cli-pattern](./assets//cdk-cli-pattern.jpg)


## CodePipeline のデプロイ

1. 動作させたいタイプを以下から選択して、CDK デプロイコマンド実行時に指定してください

    ```
    cdk deploy <STACK_NAME> --parameters githubOwnerName=<GitHub の Organization or User 名> --parameters githubRepoName=<GitHub Repository 名>
    ```

    | Stack name | Description |
    |--|--|
    | CfnDeploymentPipelineStack | デプロイに CloudFormation を利用 |
    | CdkDeploymentPipelineStack | デプロイに CDK コマンドを利用 |

1. デプロイ後、AWS の Management Console から `CodePipeline` を選択して CodePipeline の一覧を表示します

1. `Settings` -> `Connections` の順番にメニューを遷移し、`Status` が Pending になっている Connection を選択して詳細を表示します

1. `Update pending connection` をクリックし、必要な設定を行い GitHub と接続します

    ![pending-connection](./assets//pending-connection.png)


## CodePipeline のワークフロー起動

Pipeline をデプロイ時に指定した GitHub Repository の main ブランチに Push することでワークフローが起動されます


## 注意事項

- このサンプルでデプロイした AWS リソースを削除する場合、Pipeline からデプロイされる Stack (今回は CognitoStack) を Pipeline の Stack より先に削除してください。先に Pipeline の Stack を削除すると、Pipeline からデプロイされる Stack を削除する際に IAM Role に関連するエラーが出て Stack 削除が失敗する場合があります。
