# Build stage - compile TypeScript and bundle with esbuild
FROM node:22 AS build

# Install zip (needed for bun postbuild hook) and bun
RUN apt-get update && apt-get install -y zip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.1.26"
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app
COPY . .

# Use the Lambda-optimized build pipeline
RUN bun run clean:dist && bun run build:lambda && bun run prepare:lambda

# Runtime stage - AWS Lambda base image (ARM64)
FROM public.ecr.aws/lambda/nodejs:22

# Copy bundled application to Lambda task root
COPY --from=build /app/dist/lambda.mjs ${LAMBDA_TASK_ROOT}/
COPY --from=build /app/dist/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=build /app/dist/emailTemplates ${LAMBDA_TASK_ROOT}/emailTemplates
COPY --from=build /app/dist/package.json ${LAMBDA_TASK_ROOT}/

# Copy package.json to root (code uses ../../package.json relative to __dirname)
COPY --from=build /app/package.json /package.json

# Handler format: filename.exportedFunction
CMD ["lambda.handler"]
