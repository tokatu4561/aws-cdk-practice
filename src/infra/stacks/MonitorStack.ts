import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export class MonitorStack extends Stack {


  
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

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
    }
}