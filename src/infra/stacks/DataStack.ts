import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { Bucket, HttpMethods, IBucket, ObjectOwnership } from "aws-cdk-lib/aws-s3";

export class DataStack extends Stack {
  public readonly spacesTable: ITable;
  public readonly photoBucket: IBucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const suffix = getSuffixFromStack(this);

    // 写真保存 dynamodb
    this.spacesTable = new Table(this, "SpacesTable", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      tableName: `SpaceTable-${suffix}`,
    });

    // 写真保存するs3
    this.photoBucket = new Bucket(this, `SpacesFinderPhotoBucket`, {
      bucketName: `spaces-finder-photos-${suffix}`,
      cors: [
        {
          allowedMethods: [
            HttpMethods.HEAD,
            HttpMethods.GET,
            HttpMethods.PUT,
            HttpMethods.POST,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      objectOwnership: ObjectOwnership.OBJECT_WRITER, // バケット内のオブジェクトの所有者
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });
    new CfnOutput(this, "SpaceFinderPhotoBucketName", {
      value: this.photoBucket.bucketName,
    });
  }
}
