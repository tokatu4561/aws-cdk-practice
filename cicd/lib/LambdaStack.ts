import { Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";


interface LambdaStackProps extends StackProps {
    stageName?: string
}

export class LambdaStack extends Stack {

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props)

        new NodejsFunction(this, 'LambdaFunction', {
            entry: 'services/hello.ts',
            handler: 'handler',
            runtime: Runtime.NODEJS_18_X,
            environment: {
                STAGE: props.stageName!
            }
        })
    }
}