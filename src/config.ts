export interface Config {
    AMI_SSM_PARAM: string
    INSTANCE_TYPE: string
}

export const schema = {
    type: "object",
    required: [
        "AMI_SSM_PARAM",
        "INSTANCE_TYPE"
    ],
    properties: {
        AMI_SSM_PARAM: {
            type: "string"
        },
        INSTANCE_TYPE: {
            type: "string"
        }
    }
}

/**
 * Common AWS tags applied across all environments
 */
 export const tags: Record<string, string> = {
    Description: "k-ecs-bottlerocket",
    Project: "k-ecs-bottlerocket"
}
