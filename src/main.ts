import envSchema from "env-schema"
import { App } from "aws-cdk-lib"
import { BottlerocketEcs } from "./bottlerocket_ecs_stack"
import { BottlerocketEcsUpdater } from "./bottlerocket_ecs_updater_stack"
import { Config, schema } from "./config"

const arch = `${process.env.ARCH ?? "x86_64"}`
const envFile = `${__dirname}/../env_ecs_${arch}`
const stackSuffix = arch.replace("_", "-")

const config = envSchema<Config>({
    dotenv: {
        path: envFile
    },
    schema
})

const app = new App()

const clusterName = `k-ecs-bottlerocket-${stackSuffix}`

new BottlerocketEcs(app, clusterName, config)

new BottlerocketEcsUpdater(app,
    `k-ecs-bottlerocket-updater-${stackSuffix}`,
    clusterName
)

app.synth()
