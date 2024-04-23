import { App } from "aws-cdk-lib";
import { MonitorStack } from "../src/infra/stacks/MonitorStack";
import { Template } from "aws-cdk-lib/assertions";

describe('MonitorStack', () => {
    let stack: MonitorStack;
    let template: Template;
    
    beforeEach(() => {
        const testApp = new App();
        stack = new MonitorStack(testApp, 'MonitorStack');
        template = Template.fromStack(stack);
    });
    
    test('wehHookLambda prop', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Handler: 'handler',
            Environment: {
                Variables: {
                    WEBHOOK_URL: ''
                }
            }
        });
    });
    
    test('alarmTopic prop', () => {
        template.hasResourceProperties('AWS::SNS::Topic', {
            DisplayName: 'Alarm Topic',
            TopicName: 'AlarmTopic'
        });
    });
});