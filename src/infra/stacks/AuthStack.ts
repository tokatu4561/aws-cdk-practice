import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { CfnUserPoolGroup, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthStack extends Stack {
  public userPool: UserPool;
  public userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createUserPool();
    this.createUserPoolClient();
    this.createAdminsGroup();
  }

  private createUserPool() {
    this.userPool = new UserPool(this, "SpaceUserPool", {
      selfSignUpEnabled: true, // ユーザーが自分でサインアップできるようにする
      signInAliases: {
        username: true, // ユーザー名でサインインできるようにする
        email: true, // メールアドレスでサインインできるようにする
      },
    });

    new CfnOutput(this, "SpaceUserPoolId", {
      value: this.userPool.userPoolId,
    });
  }

  private createUserPoolClient() {
    // ユーザープールに対して、ユーザーが認証するためのクライアントを作成
    this.userPoolClient = this.userPool.addClient("SpaceUserPoolClient", {
      authFlows: {
        adminUserPassword: true, // 管理者がユーザーのパスワードを設定する
        custom: true, // カスタム認証フローを使用する 追加の認証フローを使用する lambdaを作成する必要がある
        userPassword: true,
        userSrp: true,
      },
    });
    new CfnOutput(this, "SpaceUserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }

  private createAdminsGroup() {
    // 管理者グループを作成
    const adminsGroup = new CfnUserPoolGroup(this, "AdminsGroup", {
      groupName: "Admins",
      userPoolId: this.userPool.userPoolId,
    });
  }
}
