export const config = {
  // ── GCP Project ──────────────────────────────────────────────
  projectId: "my-gcp-project",
  region: "us-central1",
  prefix: "tf",

  // ── VPC & Networking ─────────────────────────────────────────
  vpcName: "serverless-vpc",
  vpcSubnetName: "serverless-subnet",
  vpcSubnetCidrRange: "10.8.0.0/28",
  vpcConnectorName: "serverless-vpc-connector",
  vpcConnectorIpRange: "10.8.0.16/28",
  vpcConnectorMinInstances: 2,
  vpcConnectorMaxInstances: 3,

  // ── Cloud SQL ────────────────────────────────────────────────
  cloudSqlInstanceName: "my-database",
  cloudSqlDatabaseName: "app_db",
  cloudSqlDatabaseVersion: "POSTGRES_15",
  cloudSqlTier: "db-f1-micro",
  cloudSqlUser: "app-user",

  // ── ESPv2 API Gateway ────────────────────────────────────────
  espv2ServiceAccountName: "espv2-gateway",
  espv2GatewayName: "api-gateway",
  get endpointsServiceName(): string {
    return `api.endpoints.${this.projectId}.cloud.goog`;
  },

  // ── Backend Services (Firebase Functions exposed via ESPv2) ──
  // Add your function names here. Each becomes an internal Cloud Run
  // service behind the ESPv2 gateway.
  backendServices: ["hello"],

  // ── Secrets (stored in Secret Manager) ───────────────────────
  requiredSecrets: ["DB_PASSWORD"],

  // ── Environment Variables (injected into Cloud Run services) ─
  environmentVariables: {
    DB_NAME: "app_db",
    DB_USER: "app-user",
    DB_HOST: "10.0.0.1", // Replaced at deploy time with SQL private IP
    DB_PORT: "5432",
  },
};
