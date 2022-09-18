import { Subnet } from "aws-cdk-lib/aws-ec2"
import { CfnInclude } from "aws-cdk-lib/cloudformation-include"
import { StringParameter } from "aws-cdk-lib/aws-ssm"
import { Stack } from "aws-cdk-lib"
import { Construct } from "constructs"
import { tags } from "./config"

/**
 * Source of the template
 * https://github.com/bottlerocket-os/bottlerocket-ecs-updater/blob/develop/stacks/bottlerocket-ecs-updater.yaml
 * See also https://aws.amazon.com/blogs/containers/a-deep-dive-into-bottlerocket-ecs-updater/
 */
const templateFile = `${__dirname}/../cfn/bottlerocket-ecs-updater.yaml`

export class BottlerocketEcsUpdater extends Stack {
  constructor(scope: Construct, id: string, clusterName: string) {
    super(scope, id, {
        stackName: id,
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        },
        tags
    })

    /**
     * Bottlerocket ECS Updater version
     * https://github.com/bottlerocket-os/bottlerocket-ecs-updater/releases
     */
    const bottlerocketEcsUpdaterVersion = this.node.tryGetContext("BottlerocketEcsUpdaterVersion")

    const subnetAppB = Subnet.fromSubnetId(this, "vpc01-subnet01-b-id",
        StringParameter.valueForStringParameter(this, "vpc01-subnet01-b-id")
    )
    const subnetAppC = Subnet.fromSubnetId(this, "vpc01-subnet01-c-id",
        StringParameter.valueForStringParameter(this, "vpc01-subnet01-c-id")
    )

    new CfnInclude(this, "Template", {
      templateFile: templateFile,
      parameters: {
        "ClusterName": clusterName,
        "Subnets": [subnetAppB.subnetId, subnetAppC.subnetId].join(","),
        "UpdaterImage": `public.ecr.aws/bottlerocket/bottlerocket-ecs-updater:${bottlerocketEcsUpdaterVersion}`,
        "LogGroupName": id,
        "ScheduleState": "ENABLED"
      },
    })
  }
}
