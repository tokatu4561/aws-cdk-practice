import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  CfnUserPoolGroup,
  UserPool,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class AuthStack extends Stack {
  public userPool: UserPool;
  public userPoolClient: UserPoolClient;
  private identityPool: CfnIdentityPool;
  private authenticatedRole: Role;
  private unAuthenticatedRole: Role;
  private adminRole: Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createUserPool();
    this.createUserPoolClient();
    this.createIdentityPool();
    this.createRoles();
    this.attachRoles();
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
    new CfnUserPoolGroup(this, "AdminsGroup", {
      groupName: "Admins",
      userPoolId: this.userPool.userPoolId,
      roleArn: this.adminRole.roleArn,
    });
  }

  private createIdentityPool() {
    // 認証されたユーザーのアクセスを許可するための認証情報を提供する
    this.identityPool = new CfnIdentityPool(this, "SpaceIdentityPool", {
      allowUnauthenticatedIdentities: true, // 認証されていないユーザーのアクセスを許可する
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });
    new CfnOutput(this, "SpaceIdentityPoolId", {
      value: this.identityPool.ref,
    });
  }

  private createRoles() {
    // cognito identity pool に対して、認証されたユーザーと認証されていないユーザーのロールを作成
    // cognito identity pool がロールを引き受けて、ユーザーに代わって AWS サービスにアクセスできるようにする
    this.authenticatedRole = new Role(this, "CognitoDefaultAuthenticatedRole", {
      assumedBy: new FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity" // cognito が引き受けるロールの種類 一時的な認証情報を取得する
      ),
    });
    this.unAuthenticatedRole = new Role(
      this,
      "CognitoDefaultUnauthenticatedRole",
      {
        assumedBy: new FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );
    this.adminRole = new Role(this, "CognitoAdminRole", {
      assumedBy: new FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });
    // s3 へのフルアクセスを許可
    this.adminRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:*"],
        resources: ["*"],
      })
    );
  }

  private attachRoles() {
    new CfnIdentityPoolRoleAttachment(this, "RolesAttachment", {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: this.unAuthenticatedRole.roleArn,
      },
      roleMappings: {
        adminsMapping: {
          type: "Token",
          ambiguousRoleResolution: "AuthenticatedRole",
          identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });
  }
}
