
## デプロイ
### デプロイ用のprofile設定
aws configure --profile cdk-deploy

### デプロイ実行
cdk bootstrap --profile cdk-deploy
cdk deploy --profile cdk-deploy

## パスワードの初期設定
aws cognito-idp admin-set-user-password --user-pool-id {user_pool_id} --username {username} --password {password} --permanent