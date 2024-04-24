import * as cdk from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CodePipeline(this, 'CiCdPipeline', {
      pipelineName: 'CiCdPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('tokatu4561/aws-cdk-practice', 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ],
        primaryOutputDirectory: 'cicd/cdk.out'
      }),
    })
  }
}
