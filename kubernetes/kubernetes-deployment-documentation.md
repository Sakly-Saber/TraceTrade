# TraceTrade Kubernetes Deployment Documentation

## Overview

This document describes the complete Kubernetes deployment setup for the TraceTrade Next.js application. The deployment consists of multiple Kubernetes resources working together to provide a scalable, secure, and production-ready application hosting environment.

## Architecture Components

### 1. Deployment (`deployment.yaml`)

**Purpose**: Manages the application pods for the TraceTrade Next.js application

**Key Specifications**:
- **Replicas**: 1 (single instance)
- **Image**: `akreem/tracetrade-nextjs:v1.1`
- **Container Port**: 3000 (internal application port)
- **Resource Requests**:
  - Memory: 4Gi
  - CPU: 500m (0.5 cores)

**Environment Configuration**:
- References `trace-config` ConfigMap for environment variables

**Labels**:
- App label: `trace-deployment`
- Used for service selection and ingress routing

### 2. Service (`service.yaml`)

**Purpose**: Provides stable networking access to the deployment pods

**Specifications**:
- **Type**: ClusterIP (internal service only)
- **Port**: 8080 (exposed port)
- **Target Port**: 3000 (application container port)
- **Protocol**: TCP

**Selector**:
- Matches pods with label `app: trace-deployment`

**Function**: Routes traffic from external sources (ingress) to the application containers

### 3. Ingress (`ingress.yaml`)

**Purpose**: Manages external HTTP/HTTPS access to the application

**Specifications**:
- **Domain**: `app.deployment.sh`
- **Ingress Class**: nginx
- **TLS**: Enabled with Let's Encrypt (letsencrypt-prod cluster issuer)
- **TLS Secret**: `trace-tls`

**Routing**:
- All requests to `app.deployment.sh` are routed to `trace-deployment` service on port 8080
- Path-based routing: `/` prefix routes to root path

**Security**:
- Automatic HTTPS certificate management via cert-manager
- Production-ready TLS configuration

### 4. Horizontal Pod Autoscaler (`hpa.yml`)

**Purpose**: Automatically scales the number of application pods based on resource utilization

**Specifications**:
- **Min Replicas**: 2
- **Max Replicas**: 10
- **Target Resource**: Memory utilization
- **Target Utilization**: 70%
- **API Version**: autoscaling/v2 (latest HPA API)

**Scaling Behavior**:
- Scales up when average memory utilization exceeds 70%
- Scales down when utilization drops below target
- Automatically maintains pod availability

## Resource Flow

```
External Request (app.deployment.sh)
         ↓
    Ingress (nginx + TLS)
         ↓
Service (ClusterIP:8080 → Container:3000)
         ↓
Deployment (trace-deployment)
         ↓
Application Pod (tracetrade-nextjs)
```

## Key Features

### 🔒 Security
- **TLS Encryption**: All traffic encrypted with Let's Encrypt certificates
- **Cluster Networking**: Internal service communication via ClusterIP
- **Resource Isolation**: Dedicated pods with specific resource allocation

### 📈 Scalability
- **Auto-scaling**: HPA scales pods based on memory usage (2-10 replicas)
- **Resource Planning**: 4Gi memory and 500m CPU per pod
- **Load Distribution**: Service load balancing across pods

### 🚀 Performance
- **Efficient Resource Usage**: Resource requests ensure adequate resources
- **Fast Startup**: Single-replica deployment for quick initial deployment
- **Nginx Ingress**: High-performance reverse proxy and load balancer

### 🔧 Configuration
- **Environment Variables**: ConfigMap-based configuration management
- **Version Control**: Immutable container images with versioning
- **Declarative**: All resources defined in version-controlled YAML

## Deployment Requirements

### Prerequisites
1. **Kubernetes Cluster**: Running cluster with necessary permissions
2. **Ingress Controller**: nginx ingress controller installed
3. **cert-manager**: Installed and configured with `letsencrypt-prod` cluster issuer
4. **ConfigMap**: `trace-config` must exist with required environment variables

### External Dependencies
- **Container Registry**: Access to `akreem/tracetrade-nextjs:v1.1`
- **DNS**: `app.deployment.sh` DNS record pointing to ingress controller
- **Certificate Authority**: Let's Encrypt production environment access

## Deployment Commands

```bash
# Apply all resources
kubectl apply -f service.yaml
kubectl apply -f deployment.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yml

# Verify deployment status
kubectl get pods -l app=trace-deployment
kubectl get svc trace-deployment
kubectl get ingress trace-ingress
kubectl get hpa trace-hpa

# Monitor autoscaling
kubectl get hpa trace-hpa --watch
```

## Monitoring and Troubleshooting

### Health Checks
```bash
# Check pod status
kubectl get pods -l app=trace-deployment

# View pod logs
kubectl logs -l app=trace-deployment

# Check resource usage
kubectl top pods -l app=trace-deployment
```

### Scaling Monitoring
```bash
# Monitor HPA status
kubectl describe hpa trace-hpa

# Check current replica count
kubectl get deployment trace-deployment
```

### Ingress Troubleshooting
```bash
# Check ingress status
kubectl describe ingress trace-ingress

# Verify TLS certificate
kubectl get certificates
kubectl describe certificate trace-tls
```

## Configuration Notes

- **Environment Variables**: Application configuration via `trace-config` ConfigMap
- **Resource Limits**: Currently only requests defined; consider adding limits
- **Health Checks**: Add readiness/liveness probes for better pod management
- **Scaling**: Currently based on memory; consider adding CPU-based scaling metrics

## Production Considerations

### Recommendations
1. **Resource Limits**: Add memory and CPU limits to prevent resource exhaustion
2. **Health Probes**: Implement readiness and liveness probes
3. **Pod Disruption Budgets**: Add PDB for higher availability
4. **Monitoring**: Implement logging, metrics, and alerting
5. **Backup Strategy**: Implement database and configuration backup procedures
6. **Security Context**: Add security context and pod security policies

### Scaling Strategy
- Current setup provides basic auto-scaling via HPA
- Consider vertical pod autoscaling for right-sizing resources
- Implement cluster node auto-scaling for infrastructure elasticity

---

**Last Updated**: 2025-10-31  
**Application Version**: v1.1  
**Documentation Version**: 1.0