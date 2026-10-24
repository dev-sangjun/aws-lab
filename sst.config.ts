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

    // DLQ: stores failed messages
    const dlq = new sst.aws.Queue("JobDLQ")

    // Queue: moves a message to the DLQ after 3 failed tries
    const queue = new sst.aws.Queue("JobQueue", {
      dlq: {
        queue: dlq.arn,
        retry: 3, // 3 tries in total (maxReceiveCount)
      },
    })

    // Subscribe Lambda worker to the queue
    queue.subscribe("src/worker.handler", {
      batch: {
        size: 5,
        window: "5 seconds", // Wait up to 5 seconds to gather a batch
        partialResponses: true, // Retry only the failed messages, not the whole batch
      },
    })

    // Fargate service + ALB
    const service = new sst.aws.Service("MyService", {
      cluster,
      // Let the tasks send to the queue (permission + URL)
      link: [queue],
      // Let API Gateway find the tasks and call the Express app on port 3000
      serviceRegistry: {
        port: 3000,
      },
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

    // API Gateway connected into the VPC so it can reach the tasks
    const api = new sst.aws.ApiGatewayV2("Api", {
      vpc,
    })

    // Send all requests to the ECS tasks
    api.routePrivate("$default", service.nodes.cloudmapService.arn)

    return {
      url: service.url,
      apiUrl: api.url,
      queueUrl: queue.url,
      dlqUrl: dlq.url,
    }
  },
})
