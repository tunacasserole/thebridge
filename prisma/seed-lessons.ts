import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const lessons = [
  {
    name: 'Introduction to SRE',
    sortOrder: 1,
    isPublished: true,
    content: `# Introduction to Site Reliability Engineering

## What is SRE?

Site Reliability Engineering (SRE) is a discipline that incorporates aspects of software engineering and applies them to infrastructure and operations problems. The main goals are to create scalable and highly reliable software systems.

## Key Principles

### 1. Embrace Risk
Not everything needs to be 100% reliable. SREs work with product teams to determine appropriate availability targets based on business needs.

### 2. Service Level Objectives (SLOs)
SLOs are the tool SRE uses to set expectations for service reliability. They are defined as a percentage of time that a service should be available.

### 3. Eliminate Toil
Toil is manual, repetitive work that lacks enduring value. SREs aim to automate toil to free up time for project work.

### 4. Monitoring and Alerting
Effective monitoring is essential for maintaining reliability. SREs implement comprehensive monitoring to detect issues before they impact users.

## The Four Golden Signals

1. **Latency** - The time it takes to service a request
2. **Traffic** - How much demand is being placed on your system
3. **Errors** - The rate of requests that fail
4. **Saturation** - How "full" your service is

## Getting Started

To begin your SRE journey:
1. Start measuring your service's reliability
2. Define SLOs based on user expectations
3. Create error budgets to balance reliability and velocity
4. Automate repetitive tasks
5. Conduct blameless postmortems

> "Hope is not a strategy." - SRE Mantra
`,
  },
  {
    name: 'Incident Management',
    sortOrder: 2,
    isPublished: true,
    content: `# Incident Management

## What is an Incident?

An incident is any event that disrupts or reduces the quality of service, or which has the potential to do so. Effective incident management is crucial for maintaining reliability.

## Incident Lifecycle

### 1. Detection
- Automated monitoring and alerting
- User reports
- Synthetic monitoring

### 2. Triage
- Assess severity and impact
- Assign incident commander
- Establish communication channels

### 3. Response
- Engage necessary responders
- Document actions in real-time
- Communicate status updates

### 4. Resolution
- Implement fix
- Verify service restoration
- Close incident

### 5. Post-Incident Review
- Conduct blameless postmortem
- Document learnings
- Create action items

## Incident Roles

| Role | Responsibility |
|------|----------------|
| Incident Commander | Overall incident coordination |
| Communications Lead | External and internal updates |
| Technical Lead | Directing technical investigation |
| Scribe | Documentation and timeline |

## Severity Levels

\`\`\`
Severity 1 (Critical): Complete service outage
Severity 2 (High): Major feature unavailable
Severity 3 (Medium): Minor feature unavailable
Severity 4 (Low): Minimal impact
\`\`\`

## Best Practices

- **Use standardized terminology** across your organization
- **Maintain clear runbooks** for common incident types
- **Practice incident response** with game days
- **Always conduct postmortems** - even for minor incidents

Remember: The goal is to restore service first, investigate root cause later.
`,
  },
  {
    name: 'Monitoring & Observability',
    sortOrder: 3,
    isPublished: true,
    content: `# Monitoring & Observability

## The Three Pillars of Observability

### 1. Logs
Logs are immutable, timestamped records of events. They provide detailed context about what happened in your system.

\`\`\`json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "payment-api",
  "message": "Payment processing failed",
  "user_id": "12345",
  "error_code": "CARD_DECLINED"
}
\`\`\`

### 2. Metrics
Metrics are numeric measurements collected over time. They help you understand the state and performance of your system.

Common metric types:
- **Counter**: Always increasing (e.g., request count)
- **Gauge**: Can go up or down (e.g., CPU usage)
- **Histogram**: Distribution of values (e.g., request latency)

### 3. Traces
Traces follow a request as it travels through your distributed system, showing latency and relationships between services.

## Key Metrics to Monitor

### Application Metrics
- Request rate (requests/second)
- Error rate (errors/second)
- Latency percentiles (p50, p95, p99)
- Saturation (queue length, CPU, memory)

### Infrastructure Metrics
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput

## Alerting Best Practices

**Alert on symptoms, not causes:**
- ❌ "CPU is at 90%"
- ✅ "Request latency exceeds SLO"

**Reduce alert fatigue:**
- Set appropriate thresholds
- Use multi-window alerting
- Suppress flapping alerts

## Tools Landscape

| Category | Tools |
|----------|-------|
| Metrics | Prometheus, Datadog, New Relic |
| Logging | ELK Stack, Splunk, Coralogix |
| Tracing | Jaeger, Zipkin, Honeycomb |
| APM | Datadog, New Relic, Dynatrace |

## Building Effective Dashboards

1. **SLO Overview** - Current SLI vs target
2. **Service Health** - Error rates and latency
3. **Infrastructure** - Resource utilization
4. **Business Metrics** - User impact indicators
`,
  },
  {
    name: 'On-Call Best Practices',
    sortOrder: 4,
    isPublished: true,
    content: `# On-Call Best Practices

## Setting Up an On-Call Rotation

### Team Size
- Minimum 4-5 people for sustainable rotation
- Maximum 1 week on-call per engineer
- Include shadow shifts for training

### Handoff Process
1. Review open incidents
2. Check recent deployments
3. Document any known issues
4. Update escalation contacts

## During On-Call

### When an Alert Fires

1. **Acknowledge** the alert immediately
2. **Assess** severity and impact
3. **Communicate** in incident channel
4. **Escalate** if needed
5. **Resolve** and document

### Managing Alert Fatigue

\`\`\`
Signs of alert fatigue:
- Alerts are ignored or snoozed
- Engineers burn out quickly
- Response times increase
- False positives dominate
\`\`\`

Combat this by:
- Regular alert review and tuning
- Automated remediation where possible
- Clear runbooks for each alert
- Blameless postmortems

## Compensation and Support

### Fair Compensation
- On-call pay or time off
- Clear escalation policies
- Support from management

### Work-Life Balance
- Respect off-call time
- Provide quiet hours where possible
- Rotate holidays fairly

## Building a Healthy On-Call Culture

> "Being on-call is not about being a hero. It's about maintaining sustainable reliability."

### Key Principles

1. **Blameless culture** - Focus on systems, not people
2. **Documentation** - Runbooks and postmortems
3. **Automation** - Reduce manual intervention
4. **Training** - Regular game days and shadowing
5. **Support** - Management backing and resources

## Metrics to Track

| Metric | Target |
|--------|--------|
| MTTA (Mean Time to Acknowledge) | < 5 minutes |
| MTTR (Mean Time to Resolve) | Varies by severity |
| Pages per week | < 10 |
| False positive rate | < 20% |
`,
  },
  {
    name: 'Kubernetes for SREs',
    sortOrder: 5,
    isPublished: true,
    content: `# Kubernetes for SREs

## Core Concepts

### Pods
The smallest deployable unit in Kubernetes. A pod can contain one or more containers.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:1.0
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
\`\`\`

### Deployments
Manage the desired state of your application, including replicas and rolling updates.

### Services
Expose your application to network traffic and provide load balancing.

## Key SRE Concerns

### 1. Resource Management
- Set appropriate resource requests and limits
- Use Horizontal Pod Autoscaler (HPA)
- Implement Pod Disruption Budgets (PDB)

### 2. High Availability
- Run multiple replicas
- Use anti-affinity rules
- Spread across availability zones

\`\`\`yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        topologyKey: topology.kubernetes.io/zone
\`\`\`

### 3. Observability
- Deploy metrics exporters
- Configure logging aggregation
- Implement tracing

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| OOMKilled | Memory limit exceeded | Increase limits or optimize app |
| CrashLoopBackOff | Container keeps failing | Check logs, fix app issue |
| Pending pods | Insufficient resources | Scale cluster or reduce requests |
| ImagePullBackOff | Can't pull image | Check image name/registry auth |

## Essential kubectl Commands

\`\`\`bash
# Get pod status
kubectl get pods -o wide

# Describe a pod
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name> -f

# Execute into a pod
kubectl exec -it <pod-name> -- /bin/sh

# Get events
kubectl get events --sort-by='.lastTimestamp'
\`\`\`

## Reliability Patterns

1. **Liveness probes** - Restart unhealthy containers
2. **Readiness probes** - Remove from service until ready
3. **Startup probes** - Allow slow-starting containers
4. **Graceful shutdown** - Handle SIGTERM properly
`,
  },
];

async function seedLessons() {
  console.log('Seeding lessons...');

  for (const lesson of lessons) {
    const existing = await prisma.lesson.findFirst({
      where: { name: lesson.name },
    });

    if (existing) {
      console.log(`Updating lesson: ${lesson.name}`);
      await prisma.lesson.update({
        where: { id: existing.id },
        data: lesson,
      });
    } else {
      console.log(`Creating lesson: ${lesson.name}`);
      await prisma.lesson.create({
        data: lesson,
      });
    }
  }

  console.log(`Seeded ${lessons.length} lessons`);
}

seedLessons()
  .catch((error) => {
    console.error('Error seeding lessons:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
