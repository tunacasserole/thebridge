"use client"

import { useState } from "react"

const KUBERNETES_FACTS = [
  // Pods
  "A Pod is the smallest deployable unit in Kubernetes - it can contain one or more containers that share network and storage resources.",
  "Pods are ephemeral by design. When a Pod dies, Kubernetes doesn't resurrect it - it creates a new one with a different IP address.",
  "Multi-container Pods are useful for sidecar patterns, like adding a logging agent or service mesh proxy alongside your main application.",

  // Deployments & ReplicaSets
  "Deployments manage ReplicaSets, which in turn manage Pods. This abstraction makes rolling updates and rollbacks seamless.",
  "A ReplicaSet ensures a specified number of Pod replicas are running at any time. If a Pod crashes, it automatically creates a replacement.",
  "Rolling updates in Kubernetes allow you to update applications with zero downtime by gradually replacing old Pods with new ones.",

  // Services
  "Kubernetes Services provide stable DNS names and IP addresses for Pods, even as the Pods themselves are replaced.",
  "ClusterIP (default) exposes a Service only within the cluster. NodePort exposes it on each node's IP. LoadBalancer creates an external load balancer.",
  "A headless Service (clusterIP: None) returns the IP addresses of individual Pods instead of load-balancing - useful for stateful apps.",

  // Namespaces
  "Namespaces provide logical isolation within a cluster. They're ideal for separating dev, staging, and production environments.",
  "Resource quotas can be set per namespace to limit CPU, memory, and storage consumption - preventing one team from monopolizing resources.",

  // ConfigMaps & Secrets
  "ConfigMaps store non-sensitive configuration data as key-value pairs, while Secrets store sensitive data like passwords and API keys.",
  "Secrets are base64-encoded by default, not encrypted. For real encryption, use external secret managers or enable encryption at rest.",

  // Argo CD (GitOps)
  "Argo CD implements GitOps - your Git repository becomes the source of truth for your cluster's desired state.",
  "With Argo CD, deployments are declarative and version-controlled. Rolling back is as simple as reverting a Git commit.",
  "Argo CD continuously monitors your cluster and automatically syncs it with the manifests in Git, ensuring drift detection.",

  // Crossplane
  "Crossplane extends Kubernetes to manage cloud infrastructure as if it were native Kubernetes resources.",
  "With Crossplane, you can provision AWS RDS databases or Azure VMs using kubectl and YAML manifests - true infrastructure as code.",
  "Crossplane uses 'Compositions' to define reusable infrastructure templates, making it easy to standardize deployments across teams.",

  // Blue-Green Deployments
  "Blue-green deployment runs two identical production environments (blue and green). You route traffic to one while updating the other.",
  "Switching between blue and green is instant - just update the Service selector. If issues arise, switch back immediately.",

  // Canary Deployments
  "Canary deployments gradually roll out changes to a small subset of users before full deployment, reducing risk.",
  "Service meshes like Istio make canary deployments easier by managing traffic splitting at the network level.",

  // Autoscaling
  "Horizontal Pod Autoscaler (HPA) automatically scales the number of Pods based on CPU, memory, or custom metrics.",
  "Vertical Pod Autoscaler (VPA) adjusts the CPU and memory requests/limits of Pods based on actual usage patterns.",
  "Cluster Autoscaler adds or removes nodes from your cluster based on pending Pods that can't be scheduled.",

  // Best Practices
  "Always set resource requests and limits for Pods. Requests guarantee resources; limits prevent runaway consumption.",
  "Use readiness and liveness probes. Readiness tells Kubernetes when a Pod can receive traffic; liveness tells when to restart it.",
  "Label everything! Labels enable powerful selection and grouping - they're the foundation of Kubernetes querying.",

  // Advanced Concepts
  "StatefulSets manage stateful applications with stable network identities and persistent storage - perfect for databases.",
  "DaemonSets ensure a Pod runs on every node in the cluster - commonly used for log collectors and monitoring agents.",
  "Jobs run Pods to completion for batch processing. CronJobs run Jobs on a schedule, like cron on traditional systems.",
  "Ingress controllers manage external access to Services, providing load balancing, SSL termination, and name-based routing.",
]

export default function KubernetesFact() {
  // Pick a random fact on mount
  const [fact] = useState(() => {
    const randomIndex = Math.floor(Math.random() * KUBERNETES_FACTS.length)
    return KUBERNETES_FACTS[randomIndex]
  })

  return (
    <div className="mb-6 max-w-2xl mx-auto">
      <div
        className="p-5 rounded-lg border-2"
        style={{
          background: 'var(--md-primary-container)',
          borderColor: 'var(--md-outline-variant)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--md-primary)',
            }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: 'var(--md-on-primary)' }}
            >
              psychology
            </span>
          </div>
          <div className="flex-1">
            <div
              className="text-sm font-bold mb-2 tracking-wide uppercase"
              style={{
                color: 'var(--md-on-primary-container)',
                opacity: 0.9
              }}
            >
              Kubernetes Knowledge
            </div>
            <p
              className="text-base leading-relaxed font-medium"
              style={{
                color: 'var(--md-on-primary-container)',
                lineHeight: '1.6'
              }}
            >
              {fact}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
