import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { GoogleProvider } from "@cdktf/provider-google/lib/provider";
import { ProjectService } from "@cdktf/provider-google/lib/project-service";
import { ServiceAccount } from "@cdktf/provider-google/lib/service-account";
import { ProjectIamMember } from "@cdktf/provider-google/lib/project-iam-member";
import { ComputeNetwork } from "@cdktf/provider-google/lib/compute-network";
import { ComputeSubnetwork } from "@cdktf/provider-google/lib/compute-subnetwork";
import { ComputeGlobalAddress } from "@cdktf/provider-google/lib/compute-global-address";
import { ComputeFirewall } from "@cdktf/provider-google/lib/compute-firewall";
import { ServiceNetworkingConnection } from "@cdktf/provider-google/lib/service-networking-connection";
import { VpcAccessConnector } from "@cdktf/provider-google/lib/vpc-access-connector";
import { SqlDatabaseInstance } from "@cdktf/provider-google/lib/sql-database-instance";
import { SqlDatabase } from "@cdktf/provider-google/lib/sql-database";
import { SecretManagerSecret } from "@cdktf/provider-google/lib/secret-manager-secret";
import { SecretManagerSecretVersion } from "@cdktf/provider-google/lib/secret-manager-secret-version";
import { SecretManagerSecretIamMember } from "@cdktf/provider-google/lib/secret-manager-secret-iam-member";
import { CloudRunService } from "@cdktf/provider-google/lib/cloud-run-service";
import { CloudRunServiceIamMember } from "@cdktf/provider-google/lib/cloud-run-service-iam-member";
import { EndpointsService } from "@cdktf/provider-google/lib/endpoints-service";
import { DataGoogleProject } from "@cdktf/provider-google/lib/data-google-project";
import { config } from "./config";

// ────────────────────────────────────────────────────────────────
// OpenAPI Spec Generator for ESPv2
// ────────────────────────────────────────────────────────────────

function generateOpenApiSpec(
  routes: Record<string, string>,
  serviceName: string,
  projectId: string
): string {
  const paths = Object.entries(routes)
    .map(([routePath, backend]) => {
      const operationId = routePath.replace(/\//g, "").replace(/{/g, "").replace(/}/g, "");

      // Extract path parameters (e.g. {id})
      const pathParams = routePath.match(/{(\w+)}/g) || [];
      const pathParameters = pathParams
        .map((param) => {
          const paramName = param.replace(/[{}]/g, "");
          return `        - name: "${paramName}"
          in: path
          required: true
          type: string`;
        })
        .join("\n");

      const paramBlock = pathParameters
        ? `      parameters:
${pathParameters}`
        : "";

      const bodyParam = `        - name: "body"
          in: "body"
          required: true
          schema:
            type: "object"`;

      const postParams = pathParameters
        ? `      parameters:
${pathParameters}
${bodyParam}`
        : `      parameters:
${bodyParam}`;

      return `  ${routePath}:
    get:
      summary: "${operationId} (GET)"
      operationId: "${operationId}Get"
${paramBlock ? `${paramBlock}\n` : ""}      x-google-backend:
        address: "${backend}"
        protocol: "h2"
        jwt_audience: "${backend}"
        path_translation: APPEND_PATH_TO_ADDRESS
      security:
        - firebase: []
      responses:
        200:
          description: "OK"
        400:
          description: "Bad request"
        500:
          description: "Server error"
    post:
      summary: "${operationId} (POST)"
      operationId: "${operationId}Post"
${postParams}
      x-google-backend:
        address: "${backend}"
        protocol: "h2"
        jwt_audience: "${backend}"
        path_translation: APPEND_PATH_TO_ADDRESS
      security:
        - firebase: []
      responses:
        200:
          description: "OK"
        400:
          description: "Bad request"
        500:
          description: "Server error"
    put:
      summary: "${operationId} (PUT)"
      operationId: "${operationId}Put"
${postParams}
      x-google-backend:
        address: "${backend}"
        protocol: "h2"
        jwt_audience: "${backend}"
        path_translation: APPEND_PATH_TO_ADDRESS
      security:
        - firebase: []
      responses:
        200:
          description: "OK"
    delete:
      summary: "${operationId} (DELETE)"
      operationId: "${operationId}Delete"
${paramBlock ? `${paramBlock}\n` : ""}      x-google-backend:
        address: "${backend}"
        protocol: "h2"
        jwt_audience: "${backend}"
        path_translation: APPEND_PATH_TO_ADDRESS
      security:
        - firebase: []
      responses:
        200:
          description: "OK"`;
    })
    .join("\n");

  return `swagger: "2.0"
info:
  title: "API Gateway"
  description: "ESPv2 Gateway with Firebase JWT validation"
  version: "1.0.0"
host: "${serviceName}"
schemes:
  - "https"
produces:
  - "application/json"
consumes:
  - "application/json"
x-google-endpoints:
  - name: "${serviceName}"
    allowCors: true
securityDefinitions:
  firebase:
    authorizationUrl: ""
    flow: "implicit"
    type: "oauth2"
    x-google-issuer: "https://securetoken.google.com/${projectId}"
    x-google-jwks_uri: "https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    x-google-audiences: "${projectId}"
paths:
${paths}`;
}

// ────────────────────────────────────────────────────────────────
// Infrastructure Stack
// ────────────────────────────────────────────────────────────────

class InfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new GoogleProvider(this, "google", {
      project: config.projectId,
      region: config.region,
    });

    const project = new DataGoogleProject(this, "project", {
      projectId: config.projectId,
    });

    // ── Phase 1: Enable APIs ─────────────────────────────────

    const apis = [
      { id: "compute", service: "compute.googleapis.com" },
      { id: "sql_admin", service: "sqladmin.googleapis.com" },
      { id: "service_networking", service: "servicenetworking.googleapis.com" },
      { id: "cloud_run", service: "run.googleapis.com" },
      { id: "service_management", service: "servicemanagement.googleapis.com" },
      { id: "service_control", service: "servicecontrol.googleapis.com" },
      { id: "endpoints", service: "endpoints.googleapis.com" },
      { id: "vpc_access", service: "vpcaccess.googleapis.com" },
      { id: "secret_manager", service: "secretmanager.googleapis.com" },
    ];

    const enabledApis = apis.map(
      (api) =>
        new ProjectService(this, `${api.id}_api`, {
          project: config.projectId,
          service: api.service,
          disableOnDestroy: false,
          disableDependentServices: false,
        })
    );

    // ── Phase 2: Service Accounts & IAM ──────────────────────

    // ESPv2 Gateway Service Account
    const espv2SA = new ServiceAccount(this, "espv2_gateway_sa", {
      accountId: config.espv2ServiceAccountName,
      displayName: "ESPv2 API Gateway Service Account",
    });

    // ESPv2 → can manage Cloud Endpoints
    new ProjectIamMember(this, "espv2_service_controller", {
      project: config.projectId,
      role: "roles/servicemanagement.serviceController",
      member: `serviceAccount:${espv2SA.email}`,
    });

    // ESPv2 → can invoke Cloud Run services
    new ProjectIamMember(this, "espv2_run_invoker", {
      project: config.projectId,
      role: "roles/run.invoker",
      member: `serviceAccount:${espv2SA.email}`,
    });

    // Compute default SA → secrets + Cloud SQL
    const computeSA = `serviceAccount:${project.number}-compute@developer.gserviceaccount.com`;

    new ProjectIamMember(this, "compute_secret_accessor", {
      project: config.projectId,
      role: "roles/secretmanager.secretAccessor",
      member: computeSA,
    });

    new ProjectIamMember(this, "compute_cloudsql_client", {
      project: config.projectId,
      role: "roles/cloudsql.client",
      member: computeSA,
    });

    // App Engine default SA → scheduler, SQL, secrets, pubsub, eventarc
    const appEngineSA = `serviceAccount:${config.projectId}@appspot.gserviceaccount.com`;

    new ProjectIamMember(this, "appengine_scheduler_admin", {
      project: config.projectId,
      role: "roles/cloudscheduler.admin",
      member: appEngineSA,
    });

    new ProjectIamMember(this, "appengine_cloudsql_client", {
      project: config.projectId,
      role: "roles/cloudsql.client",
      member: appEngineSA,
    });

    new ProjectIamMember(this, "appengine_secret_accessor", {
      project: config.projectId,
      role: "roles/secretmanager.secretAccessor",
      member: appEngineSA,
    });

    new ProjectIamMember(this, "appengine_pubsub_publisher", {
      project: config.projectId,
      role: "roles/pubsub.publisher",
      member: appEngineSA,
    });

    new ProjectIamMember(this, "appengine_eventarc_receiver", {
      project: config.projectId,
      role: "roles/eventarc.eventReceiver",
      member: appEngineSA,
    });

    // ── Phase 3: VPC & Networking ────────────────────────────

    const vpcNetwork = new ComputeNetwork(this, "vpc_network", {
      name: config.vpcName,
      autoCreateSubnetworks: false,
      dependsOn: enabledApis,
    });

    const vpcSubnet = new ComputeSubnetwork(this, "vpc_subnet", {
      name: config.vpcSubnetName,
      ipCidrRange: config.vpcSubnetCidrRange,
      region: config.region,
      network: vpcNetwork.id,
    });

    // Private IP range for Cloud SQL peering
    const privateIpAllocation = new ComputeGlobalAddress(this, "private_ip_allocation", {
      name: "cloudsql-private-ip",
      purpose: "VPC_PEERING",
      addressType: "INTERNAL",
      prefixLength: 16,
      network: vpcNetwork.id,
    });

    // VPC Peering for Cloud SQL private access
    const privateSqlConnection = new ServiceNetworkingConnection(this, "private_sql_connection", {
      network: vpcNetwork.id,
      service: "servicenetworking.googleapis.com",
      reservedPeeringRanges: [privateIpAllocation.name],
    });

    // VPC Access Connector (Cloud Run → VPC)
    const vpcConnector = new VpcAccessConnector(this, "vpc_connector", {
      name: config.vpcConnectorName,
      region: config.region,
      network: vpcNetwork.name,
      ipCidrRange: config.vpcConnectorIpRange,
      minInstances: config.vpcConnectorMinInstances,
      maxInstances: config.vpcConnectorMaxInstances,
      machineType: "e2-micro",
      dependsOn: [vpcSubnet, privateSqlConnection],
    });

    // Firewall: allow VPC connector → Cloud SQL (TCP 5432)
    new ComputeFirewall(this, "allow_vpc_to_cloudsql", {
      name: "allow-vpc-connector-cloudsql-postgres",
      network: vpcNetwork.name,
      direction: "EGRESS",
      priority: 1000,
      allow: [{ protocol: "tcp", ports: ["5432"] }],
      sourceRanges: [config.vpcConnectorIpRange],
      destinationRanges: [`${privateIpAllocation.address}/16`],
      description: "Allow PostgreSQL traffic from VPC connector to Cloud SQL private IP",
      dependsOn: [privateIpAllocation],
    });

    // ── Phase 4: Cloud SQL ───────────────────────────────────

    const sqlInstance = new SqlDatabaseInstance(this, "sql_instance", {
      name: config.cloudSqlInstanceName,
      databaseVersion: config.cloudSqlDatabaseVersion,
      region: config.region,
      settings: {
        tier: config.cloudSqlTier,
        ipConfiguration: {
          ipv4Enabled: false,
          privateNetwork: vpcNetwork.id,
        },
        backupConfiguration: {
          enabled: true,
          startTime: "03:00",
        },
      },
      deletionProtection: false,
      dependsOn: [privateSqlConnection],
    });

    new SqlDatabase(this, "database", {
      name: config.cloudSqlDatabaseName,
      instance: sqlInstance.name,
    });

    // ── Phase 5: Secret Manager ──────────────────────────────

    for (const secretName of config.requiredSecrets) {
      const secret = new SecretManagerSecret(this, `secret_${secretName.toLowerCase()}`, {
        secretId: secretName,
        replication: { auto: {} },
        dependsOn: enabledApis,
      });

      new SecretManagerSecretVersion(this, `secret_version_${secretName.toLowerCase()}`, {
        secret: secret.id,
        secretData: "PLACEHOLDER_REPLACE_ME",
      });

      new SecretManagerSecretIamMember(this, `secret_access_${secretName.toLowerCase()}`, {
        project: config.projectId,
        secretId: secret.secretId,
        role: "roles/secretmanager.secretAccessor",
        member: computeSA,
      });
    }

    // ── Phase 6: Cloud Endpoints + ESPv2 Gateway ─────────────

    // Build route map: /serviceName → placeholder URL
    // In production, replace with actual Cloud Run URLs after firebase deploy
    const apiRoutes: Record<string, string> = {};
    for (const svc of config.backendServices) {
      apiRoutes[`/${svc}`] = `https://${svc.toLowerCase()}-HASH-uc.a.run.app`;
    }

    const openapiSpec = generateOpenApiSpec(
      apiRoutes,
      config.endpointsServiceName,
      config.projectId
    );

    const endpointsService = new EndpointsService(this, "endpoints", {
      serviceName: config.endpointsServiceName,
      openapiConfig: openapiSpec,
    });

    // ESPv2 Gateway (PUBLIC Cloud Run)
    const espv2Gateway = new CloudRunService(this, "espv2_gateway_service", {
      name: config.espv2GatewayName,
      location: config.region,
      template: {
        spec: {
          serviceAccountName: espv2SA.email,
          containers: [
            {
              image: "gcr.io/endpoints-release/endpoints-runtime-serverless:2",
              env: [
                {
                  name: "ENDPOINTS_SERVICE_NAME",
                  value: endpointsService.serviceName,
                },
              ],
            },
          ],
        },
        metadata: {
          annotations: {
            "run.googleapis.com/vpc-access-connector": vpcConnector.id,
            "run.googleapis.com/vpc-access-egress": "all-traffic",
          },
        },
      },
      traffic: [{ percent: 100, latestRevision: true }],
      metadata: {
        annotations: {
          "run.googleapis.com/ingress": "all", // Public — ESPv2 handles auth
        },
      },
      dependsOn: [endpointsService, vpcConnector],
    });

    // Allow unauthenticated access to ESPv2 (it validates Firebase JWT internally)
    new CloudRunServiceIamMember(this, "espv2_public_access", {
      service: espv2Gateway.name,
      location: espv2Gateway.location,
      role: "roles/run.invoker",
      member: "allUsers",
    });

    // ── Outputs ──────────────────────────────────────────────

    new TerraformOutput(this, "espv2_gateway_url", {
      value: espv2Gateway.status.get(0).url,
      description: "Public ESPv2 gateway URL (Firebase auth required)",
    });

    new TerraformOutput(this, "espv2_service_account_email", {
      value: espv2SA.email,
    });

    new TerraformOutput(this, "cloud_sql_connection_name", {
      value: sqlInstance.connectionName,
    });

    new TerraformOutput(this, "cloud_sql_private_ip", {
      value: sqlInstance.privateIpAddress,
    });

    new TerraformOutput(this, "vpc_connector_id", {
      value: vpcConnector.id,
    });

    new TerraformOutput(this, "endpoints_service_name", {
      value: endpointsService.serviceName,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// App
// ────────────────────────────────────────────────────────────────

const app = new App();
new InfrastructureStack(app, "infrastructure");
app.synth();
