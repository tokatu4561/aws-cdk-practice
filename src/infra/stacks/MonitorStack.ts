import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class MonitorStack extends Stack {


  
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

      const wehHookLambda = new NodejsFunction(this, 'wehHookLambda', {
        runtime: Runtime.NODEJS_18_X,
        entry: 'src/services/monitor/handler.ts',
        handler: 'handler',
        environment: {
          WEBHOOK_URL: process.env.WEBHOOK_URL || ''
        }
      });

      const alarmTopic = new Topic(this, 'alarmTopic', {
        displayName: 'Alarm Topic',
        topicName: 'AlarmTopic'
      });
      alarmTopic.addSubscription(new LambdaSubscription(wehHookLambda));

      const spacesApi4xxAlarm = new Alarm(this, 'spacesApi4xxAlarm', {
        metric: new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            period: Duration.minutes(1), // 1分間隔でメトリクスを取得
            statistic: 'Sum',
            unit: Unit.COUNT,
            dimensionsMap: {
                ApiName: 'SpacesApi'
            }
        }),
        evaluationPeriods: 1, // 1分間に1回評価
        threshold: 5, // 5回以上のエラーが発生したらアラームを発生させる
      });

      const topicAction = new SnsAction(alarmTopic);
      spacesApi4xxAlarm.addAlarmAction(topicAction);
    }
}