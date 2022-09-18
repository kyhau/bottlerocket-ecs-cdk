# Amazon ECS Bottlerocket stacks for testing

This repository provides example Amazon CDK stacks to deploy containers to Amazon ECS using Bottlerocket OS for the compute.
This includes deploying a Bottlerocket [updater](https://github.com/bottlerocket-os/bottlerocket-ecs-updater/) in a stack with its [CloudFormation template](https://github.com/bottlerocket-os/bottlerocket-ecs-updater/blob/develop/stacks/bottlerocket-ecs-updater.yaml).


## Deploy the stack

(Assume account/region are bootstrapped)

```bash
ARCH=arm64
cdk deploy k-ecs-bottlerocket-arm64 --require-approval never
```
Or
```bash
ARCH=x86_64
cdk deploy k-ecs-bottlerocket-x86-64 --require-approval never
```

## Updater controller

To watch the updater in realtime, you can tail the logs to gain insight into what's happening.

To tail the logs via the AWS CLI, run the following command:

```bash
aws logs tail --since 1h --follow <LOG_GROUP_NAME_HERE>
```

What is happening in realtime is the updater monitors for any hosts that are on an older version of the OS.
When it finds hosts that are outdated, it will begin to work in waves.
It will determine which host to update, and begins by putting the host into a `DRAINING` state.
Next, the scheduler will schedule those tasks to a new host which will come up because of capacity providers and cluster autoscaling.
Finally, once the tasks are rescheduled the OS update will take place and when the update is complete it will reboot and register back into the cluster.

### The Cluster

Navigate to the ECS Console, and drill down into the ECS Instances.
When the updater begins the update process, it will first set the instance to `DRAINING` as mentioned above.
When this happens, pay attention as the scheduler will begin the process of rescheduling the tasks to a new instance.
This will take a couple of minutes as cluster autoscaling will kick in to bring up a new host to run the tasks.

## Cleanup resources by running the following command

```bash
cdk destroy -f k-ecs-bottlerocket-arm64
cdk destroy -f k-ecs-bottlerocket-x86-64
```
