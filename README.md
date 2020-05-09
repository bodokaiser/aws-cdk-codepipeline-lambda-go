# aws-cdk CodePipeline Go Lambda

Example of AWS CodePipeline and AWS Lambda in Go with  `aws-cdk`.

## Usage

```shell
yarn install
npx cdk deploy PetsPipelineStack
```

Create git credentials for your account, copy the url for the CodeCommit repository and push this repo:
```shell
git remote add aws https://git-codecommit.eu-central-1.amazonaws.com/v1/repos/pets/
git push aws master
```

CodePipeline should start