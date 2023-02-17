import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling"
import {
    InstanceType,
    MachineImage,
    OperatingSystemType,
    UserData,
    Vpc
} from "aws-cdk-lib/aws-ec2"
import {
    AsgCapacityProvider,
    Cluster,
    ContainerImage,
    Ec2TaskDefinition,
    Ec2Service,
    MachineImageType,
    PlacementStrategy
} from "aws-cdk-lib/aws-ecs"
import { readFileSync } from "fs"
//import { ManagedPolicy } from "aws-cdk-lib/aws-iam"
import { Fn, Stack, Tags } from "aws-cdk-lib"
import { Construct } from "constructs"
import { StringParameter } from "aws-cdk-lib/aws-ssm"
import { Config, tags } from "./config"

export class BottlerocketEcs extends Stack {
  constructor(scope: Construct, id: string, config: Config) {
    super(scope, id, {
        stackName: id,
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        },
        tags
    })

    const clusterName = id

    const instanceType = config.INSTANCE_TYPE

    for (const key in tags) {
        Tags.of(this).add(key, tags[key])
    }

    const vpc = Vpc.fromLookup(this, "Vpc", {
        isDefault: false,
        vpcId: StringParameter.valueFromLookup(this, "vpc01-id")
    })

    const ecsCluster = new Cluster(this, clusterName, {
        clusterName,
        vpc: vpc,
    })

    const rawData = readFileSync('src/sample_user_data.toml', 'utf8');
    // const vars = {efsId: Efs.fileSystemId};
    // const userData = UserData.custom(Fn.sub(rawData, vars));
    const userData = UserData.custom(rawData);

    const bottlerocketAsg = new AutoScalingGroup(this, `${id}-asg`, {
      vpc: vpc,
      instanceType: new InstanceType(instanceType),
      machineImage: MachineImage.fromSsmParameter(
        config.AMI_SSM_PARAM, {
            os: OperatingSystemType.UNKNOWN,

            // CDK will add the following, no need to add separately
            // [settings.ecs]
            // cluster =
            userData: userData
        }
      ),
      minCapacity: 0,
      maxCapacity: 2,
    })

    // Add additional managed policy
    // bottlerocketAsg.role.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this,
    //    "TODO-additional-policy",
    //    Fn.importValue("TODO-additional-policy")))

    const capacityProviderBr = new AsgCapacityProvider(this, `${id}-asg-cap-provider`, {
      autoScalingGroup: bottlerocketAsg,
      machineImageType: MachineImageType.BOTTLEROCKET,
      enableManagedTerminationProtection: false,
    })

    ecsCluster.addAsgCapacityProvider(capacityProviderBr, {
      machineImageType: MachineImageType.BOTTLEROCKET,
    })

    const ecsTaskDef = new Ec2TaskDefinition(this, `${id}-taskdef`)
    ecsTaskDef.addContainer(`${id}-container`, {
      image: ContainerImage.fromRegistry("public.ecr.aws/nginx/nginx:latest"),
      cpu: 100,
      memoryLimitMiB: 100,
    })

    new Ec2Service(this, `${id}-service`, {
      cluster: ecsCluster,
      taskDefinition: ecsTaskDef,
      desiredCount: 1,
      placementStrategies: [
        PlacementStrategy.packedByMemory(),
        PlacementStrategy.packedByCpu(),
      ],
      capacityProviderStrategies: [
        {
          capacityProvider: capacityProviderBr.capacityProviderName,
          weight: 1,
        },
      ]
    })

  }
}
