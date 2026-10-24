/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aws-lab",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
          profile: "dev",
        },
      },
    }
  },
  async run() {
    // Network: public/private subnets across 2 AZs (SST Vpc defaults)
    const vpc = new sst.aws.Vpc("MyVpc")

    // ECS cluster
    const cluster = new sst.aws.Cluster("MyCluster", {
      vpc,
    })

    // Fargate service + ALB
    const service = new sst.aws.Service("MyService", {
      cluster,
      image: {
        context: "./",
        dockerfile: "Dockerfile",
      },
      cpu: "0.25 vCPU",
      memory: "0.5 GB",
      environment: {
        PORT: "3000",
      },
      scaling: {
        min: 2,
        max: 4,
        cpuUtilization: 70,
      },

      loadBalancer: {
        // Receive on ALB port 80 → forward to container port 3000
        rules: [{ listen: "80/http", forward: "3000/http" }],
        // Health check the ALB sends to each target (= task)
        health: {
          "3000/http": {
            path: "/health",
            interval: "10 seconds",
          },
        },
      },

      dev: {
        command: "bun run dev",
      },
    })

    return {
      url: service.url,
    }
  },
})
