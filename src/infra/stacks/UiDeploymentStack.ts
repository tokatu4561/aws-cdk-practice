import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { join } from "path";
import { existsSync } from "fs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export class UiDeploymentStack extends Stack {
  public readonly spacesTable: ITable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ui deployment bucket suffix is the same as the data stack
    const suffix = getSuffixFromStack(this);
    const deploymentBucket = new Bucket(this, `uiDeploymentBucket`, {
      bucketName: `frontend-${suffix}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const uiDir = join(__dirname, "..", "..", "..", "frontend", "dist");
    if (!existsSync(uiDir)) {
      throw new Error(`UI directory not found at ${uiDir}`);
    }

    new BucketDeployment(this, `uiDeployment`, {
      sources: [Source.asset(uiDir)],
      destinationBucket: deploymentBucket,
    });

    // create a origin access identity for the cloudfront distribution
    const originAccessIdentity = new OriginAccessIdentity(this, "OAI", {
      comment: `OAI for ${suffix}`,
    });
    deploymentBucket.grantRead(originAccessIdentity);

    // distribution
    const distribution = new Distribution(this, `uiDistribution`, {
      defaultBehavior: {
        origin: new S3Origin(deploymentBucket, {
          originAccessIdentity,
        }),
      },
    });

    // output the distribution domain name
    new CfnOutput(this, "SpaceFinderUrl", {
      value: distribution.distributionDomainName,
    });
  }
}
