import { Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  MethodOptions,
  ResourceOptions,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  spacesLambdaIntegration: LambdaIntegration;
  userPool: IUserPool;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "SpacesApi");

    // API の認証にCognitoを使用する
    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "SpacesAuthorizer",
      {
        cognitoUserPools: [props.userPool],
        identitySource: "method.request.header.Authorization", // Authorizationヘッダーを使用して認証する 認証情報の場所
      }
    );
    authorizer._attachToApi(api);

    const optionWithAuthorizer: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    };

    const optionWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE"],
      },
    };

    const spacesResource = api.root.addResource("spaces", optionWithCors);
    spacesResource.addMethod(
      "GET",
      props.spacesLambdaIntegration,
      optionWithAuthorizer
    );
    spacesResource.addMethod(
      "POST",
      props.spacesLambdaIntegration,
      optionWithAuthorizer
    );
    spacesResource.addMethod(
      "PUT",
      props.spacesLambdaIntegration,
      optionWithAuthorizer
    );
    spacesResource.addMethod(
      "DELETE",
      props.spacesLambdaIntegration,
      optionWithAuthorizer
    );
  }
}
