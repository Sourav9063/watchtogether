# Oracle VPS Best Usage For Node.js Backends

This guide targets one Oracle Cloud Always Free VPS used to learn DevOps deeply while hosting multiple Node.js backend services.

Main recommendation:

```txt
Oracle Ampere A1 VPS
-> Ubuntu ARM64
-> k3s Kubernetes
-> ingress-nginx
-> cert-manager
-> Helm
-> GitHub Container Registry
-> GitHub Actions or manual kubectl deploy
```

Separate optimized/simple path is included at end:

```txt
Oracle VPS
-> Docker Compose
-> Caddy or Nginx
```

Use Kubernetes path if learning is primary goal. Use Compose/Caddy path if uptime with least maintenance is primary goal.

## 0. Beginner Mental Model

Before commands, know what each layer does. DevOps becomes easier when every command has a place in this chain:

```txt
Domain name
-> DNS record
-> public IP
-> cloud firewall
-> Linux firewall
-> reverse proxy / ingress
-> app service
-> app process/container
-> database/storage
```

If a website/API does not load, debug from outside to inside:

```txt
Does DNS point to the right IP?
Can port 80/443 reach the server?
Is Linux firewall allowing it?
Is ingress/reverse proxy listening?
Does Kubernetes Service find the Pod?
Is the app process healthy?
```

### 0.1 Common Words

```txt
VPS / VM
  Virtual server rented from cloud provider. You get CPU, RAM, disk, public IP, and SSH access.

Public IP
  Address reachable from internet. DNS points your domain to this.

Private IP
  Internal cloud-network address. Other machines in same private network can use it, internet usually cannot.

DNS A record
  Mapping from hostname to IPv4 address. Example: api.example.com -> 129.x.x.x.

Port
  Number where a network service listens. SSH uses 22, HTTP uses 80, HTTPS uses 443.

Firewall
  Rules deciding which ports/IPs can connect. In this setup there are two firewalls: Oracle cloud firewall and Ubuntu UFW.

SSH
  Secure shell login to server. Uses private key on your computer and public key on server.

Container image
  Packaged app filesystem plus start command. Example: ghcr.io/user/api:sha.

Container
  Running instance of an image.

Pod
  Smallest Kubernetes runtime unit. Usually one app container plus Kubernetes metadata/networking.

Deployment
  Kubernetes object that keeps desired number of Pods running and handles rollout/rollback.

Service
  Stable internal network name/IP for Pods. Pods change; Service name stays.

Ingress
  Kubernetes HTTP routing rule. Hostname/path -> Service.

Ingress controller
  Actual proxy that reads Ingress rules and receives public traffic. Here: ingress-nginx.

TLS certificate
  HTTPS certificate proving domain identity. cert-manager requests and renews it.

Secret
  Kubernetes object for sensitive values like API keys. Base64 is not encryption; protect access.

ConfigMap
  Kubernetes object for non-secret config like PORT or LOG_LEVEL.

PVC
  PersistentVolumeClaim. App asks Kubernetes for durable disk storage.
```

### 0.2 Request Flow In Kubernetes Setup

Example: browser calls `https://stream.example.com/health`.

```txt
1. Browser asks DNS: "What IP is stream.example.com?"
2. DNS returns Oracle public IP.
3. Browser connects to Oracle public IP on port 443.
4. OCI Security List/NSG allows 443.
5. Ubuntu UFW allows 443.
6. ingress-nginx receives HTTPS request.
7. ingress-nginx checks Kubernetes Ingress rules.
8. Matching rule says stream.example.com -> Service stream-api.
9. Service sends request to one healthy stream-api Pod.
10. Pod container runs Node.js app and returns response.
```

This is why app ports like `4000` do not need to be public. Public traffic enters through `80/443`, then Kubernetes routes internally.

### 0.3 Why Two Firewalls

Oracle firewall protects server before traffic reaches Linux. UFW protects inside Linux.

Use both:

```txt
OCI NSG/Security List = cloud edge protection
UFW = server-level protection
```

If port is blocked in either one, request fails.

### 0.4 What To Learn First

Learn in this order:

```txt
Linux basics
-> SSH keys and file permissions
-> DNS and ports
-> Docker image/container basics
-> Kubernetes Pod/Deployment/Service
-> Ingress and TLS
-> Secrets/config
-> storage/backups
-> monitoring/logging
-> CI/CD
```

Do not start with service mesh, multi-node storage, or GitOps. Those are later topics.

## 1. Best Learning Architecture: Kubernetes On Oracle VPS

### 1.1 Why k3s, Not Full kubeadm

Use k3s for one Oracle Free Tier VPS.

k3s is real CNCF-certified Kubernetes, but lighter. It gives Kubernetes objects, scheduling, Services, Ingress, Helm, Secrets, ConfigMaps, probes, rolling deploys, and cluster networking without full kubeadm overhead.

Do not start with kubeadm on one free VPS. It teaches Kubernetes, but it also burns more CPU/RAM and creates more operational noise than useful learning.

Good learning path:

```txt
k3s
-> disable default Traefik
-> install ingress-nginx yourself
-> install cert-manager yourself
-> deploy apps with Helm
-> add monitoring/logging later
```

This avoids Caddy magic and teaches actual Kubernetes networking.

### 1.2 Target Architecture

```txt
Browser / API client
  |
DNS A records
  |
Oracle public IP
  |
OCI Network Security Group or Security List
  |
Ubuntu UFW firewall
  |
k3s node
  |
ingress-nginx controller :80/:443
  |
Kubernetes Ingress
  |
Kubernetes Service
  |
Node.js Deployment Pods
  |
ConfigMaps / Secrets / PVCs
```

Recommended hostnames:

```txt
api.example.com       -> general API
stream.example.com    -> stream/torrent backend
socket.example.com    -> Socket.IO backend
admin.example.com     -> internal admin tools
monitor.example.com   -> Uptime Kuma/Grafana, protected
```

### 1.3 Oracle Free Tier Shape

Prefer:

```txt
VM.Standard.A1.Flex
Ubuntu 24.04 ARM64 or Ubuntu 22.04 ARM64
2 OCPU / 12 GB RAM minimum
4 OCPU / 24 GB RAM ideal
100-200 GB boot volume
```

Oracle Always Free currently documents Ampere A1 as 3,000 OCPU hours and 18,000 GB-hours per month, equivalent to 4 OCPU and 24 GB memory for Always Free tenancies. Capacity can be unavailable in some regions or availability domains.

Official docs:

- Oracle Free Tier: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- Always Free resources: https://docs.oracle.com/iaas/Content/FreeTier/resourceref.htm

Avoid AMD micro instances for this use case. They are fine for tiny cron/API tests, not for Kubernetes plus multiple Node services.

## 2. Cloud And Server Setup

### 2.1 Oracle Cloud Resources

Create:

```txt
1 compartment: personal-apps
1 VCN: apps-vcn
1 public subnet
1 Network Security Group: apps-public-nsg
1 reserved public IPv4
1 Ampere A1 instance
```

Prefer Network Security Groups over editing broad default security lists. Security lists and NSGs act as virtual firewalls in OCI.

Official docs:

- Security lists: https://docs.oracle.com/iaas/Content/Network/Concepts/securitylists.htm
- Security rules: https://docs.public.content.oci.oraclecloud.com/en-us/iaas/compute-cloud-at-customer/cmn/network/security-rules.htm

### 2.2 OCI Ingress Rules

Open only:

```txt
22/tcp    from your home IP only
80/tcp    from 0.0.0.0/0
443/tcp   from 0.0.0.0/0
```

Optional for Kubernetes learning across multiple nodes:

```txt
6443/tcp  from your IP only
```

Do not expose app ports like `3000`, `4000`, `5000` publicly. Kubernetes Services should stay internal.

Optional for legal torrent/media backend:

```txt
custom peer port/tcp+udp from 0.0.0.0/0
```

Only open peer ports if backend needs inbound peer connectivity and you understand bandwidth/legal risk.

### 2.3 DNS

At DNS provider:

```txt
A api.example.com      <oracle_reserved_public_ip>
A stream.example.com   <oracle_reserved_public_ip>
A socket.example.com   <oracle_reserved_public_ip>
A monitor.example.com  <oracle_reserved_public_ip>
```

Use low TTL during setup:

```txt
300 seconds
```

Raise later:

```txt
3600 seconds
```

### 2.4 Ubuntu Bootstrap

SSH into VM:

```bash
# Connect to Oracle VM with default Ubuntu user.
# YOUR_ORACLE_IP is public IPv4 shown in OCI console.
ssh ubuntu@YOUR_ORACLE_IP
```

What happens:

```txt
ssh opens encrypted terminal session to server.
ubuntu is default login user for Ubuntu images.
server checks your SSH public key against ~/.ssh/authorized_keys.
```

Update:

```bash
# Download latest package index from Ubuntu repositories.
sudo apt update

# Upgrade installed packages to patched versions.
sudo apt upgrade -y

# Reboot so kernel/system package upgrades fully apply.
sudo reboot
```

What these commands mean:

```txt
sudo
  Run command as root/admin. Needed for system changes.

apt update
  Refresh package list. Does not upgrade anything by itself.

apt upgrade -y
  Install available upgrades. -y answers yes automatically.

reboot
  Restart server. Required after many kernel/security updates.
```

Create deploy user:

```bash
# Create a new normal Linux user named deploy.
# It asks for password and basic user info.
# Use this user for daily admin/deploy work instead of default ubuntu/root.
sudo adduser deploy

# Add deploy user to sudo group.
# -aG means append to supplementary group list.
# Without -a, user could lose existing groups.
# Members of sudo group can run commands as root with sudo.
sudo usermod -aG sudo deploy

# Create SSH config directory for deploy user.
# -p means create parent directories if needed and do not error if already exists.
sudo mkdir -p /home/deploy/.ssh

# Copy current ubuntu user's allowed public keys to deploy user.
# This lets the same SSH key log in as deploy.
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys

# Make deploy own its home SSH files.
# chown = change owner.
# -R means recursive, so directory and files inside both change.
# Format user:group means owner deploy, group deploy.
sudo chown -R deploy:deploy /home/deploy/.ssh

# Lock down .ssh directory.
# 700 means owner can read/write/enter; nobody else can access.
# SSH refuses insecure permission sometimes.
sudo chmod 700 /home/deploy/.ssh

# Lock down authorized_keys file.
# 600 means owner can read/write; nobody else can read.
# This file contains public keys allowed to log in as deploy.
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Why create `deploy` user:

```txt
root user has unlimited power.
default ubuntu user is fine, but separate deploy user makes ownership and automation clearer.
deploy user can manage apps without using root login.
sudo still allows admin actions when needed.
```

How SSH key login works:

```txt
your laptop has private key
server has matching public key in authorized_keys
SSH proves private key matches public key
server allows login without password
```

Important file permissions:

```txt
/home/deploy/.ssh                 700
/home/deploy/.ssh/authorized_keys 600
owner                             deploy:deploy
```

If permissions are too open, SSH may ignore the keys for safety.

Harden SSH:

```bash
# Open SSH server config in nano editor.
sudo nano /etc/ssh/sshd_config
```

Set:

```txt
PermitRootLogin no
  Disable direct root SSH login. Attackers often try root first.

PasswordAuthentication no
  Disable password login. SSH key login is much safer than passwords.

KbdInteractiveAuthentication no
  Disable keyboard-interactive password prompts.

PubkeyAuthentication yes
  Allow SSH public/private key login.
```

Restart SSH:

```bash
# Reload SSH daemon so config changes apply.
# Existing SSH sessions usually stay open.
sudo systemctl restart ssh
```

Keep current SSH session open. Test new session before closing old one:

```bash
# Open a second terminal and verify deploy login works.
ssh deploy@YOUR_ORACLE_IP
```

Why keep current session open:

```txt
If SSH config is wrong, new login may fail.
Old session lets you fix config instead of losing server access.
```

### 2.5 UFW Firewall

Install and enable:

```bash
# Install host firewall, brute-force protection, and automatic security updates.
sudo apt install -y ufw fail2ban unattended-upgrades

# Block incoming connections unless explicitly allowed.
sudo ufw default deny incoming

# Allow server to make outbound requests.
# Needed for package downloads, Docker pulls, Let's Encrypt, APIs.
sudo ufw default allow outgoing

# Allow SSH. Do this before enabling UFW or you may lock yourself out.
sudo ufw allow 22/tcp

# Allow HTTP. Needed for Let's Encrypt HTTP-01 challenge and redirects.
sudo ufw allow 80/tcp

# Allow HTTPS. Main public traffic enters here.
sudo ufw allow 443/tcp

# Enable firewall interactively.
sudo ufw enable

# Show active firewall rules.
sudo ufw status verbose
```

If you expose Kubernetes API to your own IP:

```bash
# Only your IP can reach Kubernetes API server.
# Never expose 6443 to the full internet.
sudo ufw allow from YOUR_HOME_IP to any port 6443 proto tcp
```

What these tools do:

```txt
ufw
  Simple Linux firewall frontend.

fail2ban
  Watches logs and bans repeated failed login attempts.

unattended-upgrades
  Automatically applies important security updates.
```

## 3. Install Kubernetes With k3s

### 3.0 Kubernetes Basics Before Install

Kubernetes is a control system. You tell it desired state, and it tries to keep server matching that state.

Example desired state:

```txt
run 1 copy of stream-api
use image ghcr.io/me/stream-api:abc123
restart it if it crashes
send stream.example.com traffic to it
keep 50Gi cache disk mounted
```

Kubernetes main idea:

```txt
You do not manually start app processes.
You create objects.
Kubernetes starts and repairs processes for you.
```

Important objects:

```txt
Pod
  Runs container(s). If Pod dies, replacement Pod may get new IP.

Deployment
  Creates and updates Pods. Handles rollout and rollback.

Service
  Stable internal address for Pods. Other apps talk to Service, not Pod IP.

Ingress
  Public HTTP rule. Example: stream.example.com -> stream-api Service.

ConfigMap
  Non-secret environment/config values.

Secret
  Sensitive environment/config values.

PersistentVolumeClaim
  Request for disk storage that survives Pod restart.
```

`kubectl` is Kubernetes command-line client:

```txt
kubectl sends requests to Kubernetes API server.
Kubernetes API server stores desired state.
controllers compare desired state vs real state.
container runtime starts/stops containers to match desired state.
```

`kubeconfig` tells `kubectl` where cluster is and which credentials to use.

### 3.1 Install k3s Without Default Traefik

k3s deploys Traefik by default. For learning ingress-nginx, disable Traefik.

Official docs:

- k3s requirements: https://docs.k3s.io/installation/requirements
- k3s networking services: https://docs.k3s.io/networking/networking-services
- k3s packaged components: https://docs.k3s.io/installation/packaged-components

Install:

```bash
# Download k3s installer and run it.
# INSTALL_K3S_EXEC passes extra server flags.
# server means this machine is Kubernetes control plane.
# --disable=traefik removes default ingress controller so we can install ingress-nginx manually.
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable=traefik" sh -
```

Make kubeconfig usable:

```bash
# Create local kubeconfig directory for current user.
mkdir -p ~/.kube

# Copy k3s admin kubeconfig from root-owned location.
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

# Make current user own kubeconfig.
# Without this, kubectl may require sudo.
sudo chown "$USER":"$USER" ~/.kube/config

# Only current user can read/write kubeconfig.
# Kubeconfig contains cluster admin credentials, so keep it private.
chmod 600 ~/.kube/config
```

Check:

```bash
# Show cluster nodes. -o wide includes IP, OS, runtime info.
kubectl get nodes -o wide

# Show all Pods in all namespaces.
# -A means all namespaces.
kubectl get pods -A
```

Expected:

```txt
node Ready
coredns Running
local-path-provisioner Running
metrics-server Running
```

### 3.2 Learn What k3s Installed

Important pieces:

```txt
kube-apiserver    Kubernetes API
scheduler         chooses which node runs Pod
controller        reconciles desired state
containerd        container runtime
CoreDNS           service DNS inside cluster
Flannel           pod network
ServiceLB         simple LoadBalancer implementation
local-path        local PersistentVolume provider
metrics-server    basic CPU/RAM metrics
```

k3s minimum server requirement is 2 cores and 2 GB RAM, but real apps need more. For this VPS, 2 OCPU/12 GB is comfortable for learning. 4 OCPU/24 GB is much better for multiple services.

How these pieces work together:

```txt
kubectl apply -f deployment.yaml
-> kube-apiserver receives request
-> Deployment controller sees desired app replica count
-> scheduler picks node for Pod
-> containerd pulls image and starts container
-> kubelet watches container health
-> Service routes internal traffic to ready Pod
```

## 4. Install Kubernetes Tooling

### 4.1 Install Helm

```bash
# Download official Helm installer script and run it.
# Helm is package manager for Kubernetes, like apt for cluster apps.
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Confirm Helm installed and can run.
helm version
```

Helm teaches production-style packaging better than raw YAML only.

Use raw YAML first for learning basic objects. Move to Helm once patterns repeat.

### 4.2 Install ingress-nginx

Ingress is needed to route public HTTP/HTTPS traffic to many services by hostname/path.

Official docs:

- ingress-nginx bare metal notes: https://kubernetes.github.io/ingress-nginx/deploy/baremetal/

Install:

```bash
# Add ingress-nginx Helm chart repository.
# Helm repo is where installable Kubernetes packages live.
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Download latest chart index from configured Helm repos.
helm repo update

# Create namespace for ingress controller resources.
# Namespace keeps ingress-nginx objects separate from your apps.
kubectl create namespace ingress-nginx

# Install or upgrade ingress-nginx.
# upgrade --install means: install if missing, upgrade if already installed.
# controller.service.type=LoadBalancer asks Kubernetes for public entrypoint.
# On k3s single-node, ServiceLB maps this to host ports 80/443.
# externalTrafficPolicy=Local preserves client IP better than Cluster in many cases.
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --set controller.service.type=LoadBalancer \
  --set controller.service.externalTrafficPolicy=Local
```

Check:

```bash
# Check ingress-nginx Pods are Running.
kubectl get pods -n ingress-nginx

# Check Service and exposed ports.
kubectl get svc -n ingress-nginx
```

On k3s, ServiceLB should expose `80` and `443` on the node.

Verify ports:

```bash
# Show Linux processes listening on TCP/UDP ports.
# grep filters to HTTP/HTTPS ports.
sudo ss -tulpn | grep -E ':80|:443'
```

What ingress-nginx does:

```txt
It runs Nginx inside Kubernetes.
It watches Ingress objects.
It updates Nginx routing config automatically.
It receives public 80/443 traffic and forwards to Services.
```

### 4.3 Install cert-manager

cert-manager automates Let's Encrypt certificates for Ingress.

Official docs:

- cert-manager installation: https://cert-manager.io/docs/installation/

Install with Helm:

```bash
# Add Jetstack Helm repo. Jetstack maintains cert-manager.
helm repo add jetstack https://charts.jetstack.io

# Refresh Helm repo index.
helm repo update

# Create namespace for cert-manager system Pods.
kubectl create namespace cert-manager

# Install cert-manager.
# crds.enabled=true installs Custom Resource Definitions like Certificate and ClusterIssuer.
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --set crds.enabled=true
```

Check:

```bash
# Confirm cert-manager controller Pods are Running.
kubectl get pods -n cert-manager

# Confirm cert-manager CRDs exist.
# CRDs extend Kubernetes API with new object types.
kubectl get crds | grep cert-manager
```

Create production ClusterIssuer:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: your-email@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
```

Apply:

```bash
# Apply YAML file to cluster.
# This creates ClusterIssuer object used by Ingress annotations.
kubectl apply -f clusterissuer-letsencrypt-prod.yaml
```

Use staging while testing:

```yaml
server: https://acme-staging-v02.api.letsencrypt.org/directory
```

Switch to production after HTTP routing works.

How cert-manager works:

```txt
Ingress has annotation cert-manager.io/cluster-issuer.
cert-manager sees Ingress needs TLS Secret.
cert-manager asks Let's Encrypt for certificate.
Let's Encrypt checks domain by hitting http://domain/.well-known/acme-challenge/...
ingress-nginx serves challenge response.
If check passes, cert-manager stores certificate in Kubernetes Secret.
ingress-nginx uses that Secret for HTTPS.
```

Common beginner mistake:

```txt
Port 80 must be open for HTTP-01 challenge.
Even if final app uses HTTPS, Let's Encrypt often needs HTTP to prove domain ownership.
```

## 5. Kubernetes Object Model For Node Apps

Every backend service should have:

```txt
Namespace
ConfigMap
Secret
Deployment
Service
Ingress
HorizontalPodAutoscaler optional
PersistentVolumeClaim optional
```

### 5.1 Namespace Per App Or Environment

Simple personal setup:

```txt
apps
monitoring
ingress-nginx
cert-manager
```

Use one `apps` namespace first:

```bash
kubectl create namespace apps
```

Later:

```txt
watchtogether-prod
stream-prod
socket-prod
```

### 5.2 Deployment Template For Node.js API

Example:

```yaml
# Kubernetes API group/version for Deployment objects.
apiVersion: apps/v1
kind: Deployment
metadata:
  # Deployment name. Used by kubectl commands and labels.
  name: stream-api
  # Namespace where this app lives.
  namespace: apps
  labels:
    app: stream-api
spec:
  # Number of Pod copies to keep running.
  replicas: 1
  # Keep last 3 rollout versions for rollback.
  revisionHistoryLimit: 3
  selector:
    # Deployment controls Pods with this label.
    matchLabels:
      app: stream-api
  strategy:
    # RollingUpdate replaces old Pods gradually.
    type: RollingUpdate
    rollingUpdate:
      # Keep old Pod until new Pod is ready.
      maxUnavailable: 0
      # Allow one extra Pod during rollout.
      maxSurge: 1
  template:
    metadata:
      # Labels applied to Pods. Must match selector above.
      labels:
        app: stream-api
    spec:
      containers:
        - name: stream-api
          # Container image to run.
          image: ghcr.io/YOUR_USER/stream-api:latest
          # Always check registry for latest tag.
          # For SHA-pinned tags, IfNotPresent is also fine.
          imagePullPolicy: Always
          ports:
            # Port app listens on inside container.
            - containerPort: 4000
          envFrom:
            # Load non-secret environment variables.
            - configMapRef:
                name: stream-api-config
            # Load secret environment variables.
            - secretRef:
                name: stream-api-secret
          resources:
            # Scheduler uses requests to reserve capacity.
            requests:
              cpu: 100m
              memory: 256Mi
            # Kubernetes can throttle/kill container above limits.
            limits:
              cpu: 1000m
              memory: 1024Mi
          readinessProbe:
            # If this fails, Pod is removed from Service traffic.
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 6
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 20
            timeoutSeconds: 2
            failureThreshold: 3
```

Why these matter:

```txt
readinessProbe  keeps broken Pod out of traffic
livenessProbe   restarts stuck process
resources       prevents one service eating whole VPS
rollingUpdate   deploys new Pod before killing old Pod
```

For very small VPS, use `replicas: 1`. For critical stateless API, use `replicas: 2` if CPU/RAM allow.

### 5.3 Service Template

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stream-api
  namespace: apps
spec:
  # ClusterIP means only reachable inside Kubernetes cluster.
  type: ClusterIP
  selector:
    # Send traffic to Pods with app=stream-api label.
    app: stream-api
  ports:
    - name: http
      # Service port. Other cluster components call this.
      port: 80
      # Container port on matching Pods.
      targetPort: 4000
```

Use `ClusterIP` for app services. Only ingress-nginx gets public traffic.

### 5.4 Ingress Template

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: stream-api
  namespace: apps
  annotations:
    # cert-manager uses this ClusterIssuer to create TLS cert.
    cert-manager.io/cluster-issuer: letsencrypt-prod
    # Keep long requests/websocket/stream connections alive.
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    # Max upload/body size accepted through ingress.
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  # Tell Kubernetes this Ingress belongs to ingress-nginx.
  ingressClassName: nginx
  tls:
    - hosts:
        - stream.example.com
      # cert-manager stores certificate here.
      secretName: stream-api-tls
  rules:
    - host: stream.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                # Forward matching requests to this Service.
                name: stream-api
                port:
                  number: 80
```

Long timeouts matter for WebSocket and streaming APIs.

### 5.5 ConfigMap And Secret

ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: stream-api-config
  namespace: apps
data:
  NODE_ENV: "production"
  PORT: "4000"
  LOG_LEVEL: "info"
```

Secret:

```bash
kubectl create secret generic stream-api-secret \
  --namespace apps \
  --from-literal=API_KEY='replace-me' \
  --from-literal=DATABASE_URL='replace-me'
```

Do not commit raw Secret YAML with real values.

Better later:

```txt
SOPS + age
External Secrets Operator
Sealed Secrets
OCI Vault
```

For learning, start with `kubectl create secret`. Upgrade once deployment flow is stable.

## 6. Containerizing Node.js Apps

Kubernetes does not run your source code directly. It runs container images.

Flow:

```txt
source code
-> Dockerfile
-> docker build
-> container image
-> push image to registry
-> Kubernetes pulls image
-> Pod runs container
```

Registry is image storage. Good default:

```txt
GitHub Container Registry = ghcr.io
```

### 6.1 Dockerfile For Node 22 API

Use multi-stage build:

```dockerfile
# Build dependency layer.
FROM node:22-bookworm-slim AS deps

# Set working directory inside image.
WORKDIR /app

# Copy only package files first so Docker can cache npm install.
COPY package*.json ./

# Install production dependencies only.
RUN npm ci --omit=dev

# Final runtime image.
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Tell Node/libs this is production.
ENV NODE_ENV=production

# Copy installed dependencies from deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source.
COPY . .

# Run app as non-root node user included in official image.
USER node

# Document container port. Kubernetes still needs containerPort/Service config.
EXPOSE 4000

# Start app.
CMD ["node", "server.js"]
```

For Next.js standalone backend:

```dockerfile
# Install dependencies.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build Next.js app.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime image.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Add `.dockerignore`:

```txt
node_modules          # installed locally; image installs fresh deps
.next                 # local build output; image builds its own
.git                  # git history not needed in image
.env*                 # never copy secrets into image
npm-debug.log         # local debug files not needed
Dockerfile            # optional; not needed at runtime
docker-compose.yml    # optional; not needed at runtime
```

Why `.dockerignore` matters:

```txt
smaller build context
faster builds
fewer accidental secret leaks
more reproducible image
```

### 6.2 Health Endpoint

Every backend should expose:

```txt
GET /health
```

Response:

```json
{
  "ok": true,
  "service": "stream-api",
  "version": "1.0.0"
}
```

Readiness should not require external optional providers. If database is required for all requests, include DB ping. If provider outage should not remove whole app from traffic, keep readiness local.

## 7. Deployment Workflow

### 7.1 Container Registry

Use GitHub Container Registry:

```txt
ghcr.io/YOUR_USER/service-name:git-sha
ghcr.io/YOUR_USER/service-name:latest
```

Avoid deploying only `latest` for serious services. Pin deployments to git SHA when possible.

### 7.2 Manual Deploy First

Build locally or in GitHub Actions:

```bash
# Build image from current directory Dockerfile.
# -t assigns image name/tag.
docker build -t ghcr.io/YOUR_USER/stream-api:latest .

# Upload image to GitHub Container Registry.
# Kubernetes node will pull image from there.
docker push ghcr.io/YOUR_USER/stream-api:latest
```

On VPS:

```bash
# Restart Pods for Deployment.
# Useful when image tag is same, like latest.
kubectl rollout restart deployment/stream-api -n apps

# Wait until rollout finishes or fails.
kubectl rollout status deployment/stream-api -n apps

# Show Pods in apps namespace.
kubectl get pods -n apps

# Show recent logs from Deployment.
kubectl logs -n apps deployment/stream-api --tail=100
```

Better:

```bash
# Update Deployment image to specific immutable tag.
# Safer than latest because rollback/history is clear.
kubectl set image deployment/stream-api \
  stream-api=ghcr.io/YOUR_USER/stream-api:GIT_SHA \
  -n apps
```

Rollback:

```bash
# Show previous rollout revisions.
kubectl rollout history deployment/stream-api -n apps

# Roll back to previous revision.
kubectl rollout undo deployment/stream-api -n apps
```

### 7.3 GitHub Actions Deploy Later

GitHub Actions is CI/CD.

```txt
CI = Continuous Integration
  Run checks automatically after code changes.

CD = Continuous Deployment/Delivery
  Build and deploy automatically after checks pass.
```

Pipeline:

```txt
push main
-> npm ci
-> npm run lint
-> npm run build
-> docker build
-> docker push ghcr.io
-> ssh to VPS
-> kubectl set image
-> kubectl rollout status
```

Use GitHub secrets:

```txt
VPS_HOST
VPS_USER
VPS_SSH_KEY
GHCR_TOKEN
```

Do not store kubeconfig in GitHub unless needed. SSH command on VPS can use local kubeconfig.

Why deploy through SSH first:

```txt
It is easier to understand.
GitHub connects to VPS.
VPS already has kubectl configured.
GitHub does not need cluster admin kubeconfig.
```

Example deploy step shape:

```yaml
# This is only the deploy part, not full workflow.
- name: Deploy on VPS
  uses: appleboy/ssh-action@v1.0.3
  with:
    # Public IP or hostname of VPS.
    host: ${{ secrets.VPS_HOST }}
    # Usually deploy user created earlier.
    username: ${{ secrets.VPS_USER }}
    # Private SSH key stored in GitHub Secrets.
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      # Update Deployment image to new immutable image tag.
      kubectl set image deployment/stream-api \
        stream-api=ghcr.io/YOUR_USER/stream-api:${{ github.sha }} \
        -n apps

      # Wait for rollout to finish. Fails workflow if rollout fails.
      kubectl rollout status deployment/stream-api -n apps --timeout=180s
```

What each secret means:

```txt
VPS_HOST
  Server public IP or DNS name.

VPS_USER
  SSH username, usually deploy.

VPS_SSH_KEY
  Private key GitHub uses to SSH into VPS.
  Public half must be in /home/deploy/.ssh/authorized_keys.

GHCR_TOKEN
  Token allowed to push/pull container images from GitHub Container Registry.
```

Safer deploy rule:

```txt
Build image with git SHA tag.
Deploy git SHA tag.
Avoid deploying latest only.
```

## 8. Storage And Databases

### 8.1 Local Path Storage

k3s includes local-path provisioner. Good for learning and single-node data.

Storage problem:

```txt
Container filesystem is temporary.
If Pod is deleted and recreated, files inside container can disappear.
Database/cache/upload data needs persistent storage.
```

PVC solution:

```txt
Pod asks for storage using PersistentVolumeClaim.
k3s local-path creates directory on server disk.
Pod mounts that directory at chosen path.
Data survives Pod restart.
```

Example PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  # PVC name used by Pod volume claimName.
  name: stream-cache
  namespace: apps
spec:
  accessModes:
    # One node can mount this volume read/write.
    - ReadWriteOnce
  resources:
    requests:
      # Reserve 50Gi from node disk.
      storage: 50Gi
```

Mount:

```yaml
volumeMounts:
  # Mount volume inside container at /data/cache.
  - name: stream-cache
    mountPath: /data/cache
volumes:
  # Attach PVC to Pod as volume named stream-cache.
  - name: stream-cache
    persistentVolumeClaim:
      claimName: stream-cache
```

Important:

```txt
local-path storage ties Pod data to this node
single node is fine
multi-node later needs real storage plan
```

### 8.2 Database Options

Personal/small:

```txt
Postgres in Kubernetes with PVC
Redis in Kubernetes with PVC or no persistence
```

More production:

```txt
managed Postgres outside cluster
OCI Autonomous DB if fits workload
external backup storage
```

For learning, run Postgres in cluster once. For important data, backup aggressively.

Beginner recommendation:

```txt
Start with Postgres in Kubernetes only for learning.
Use managed/external Postgres for anything painful to lose.
Never treat PVC as backup.
```

Why database inside Kubernetes is harder:

```txt
database needs durable disk
database needs backups
database upgrades need care
single-node disk failure loses data
bad resource limits can slow or kill DB
```

Good first production split:

```txt
Kubernetes on Oracle VPS = APIs, workers, streamer
External managed DB       = important persistent app data
PVC on Oracle VPS         = cache, temp files, learning DB
```

### 8.3 Backup Strategy

Back up:

```txt
Kubernetes manifests / Helm values
Secrets source, encrypted
Postgres dumps
PVC data if important
/etc/rancher/k3s/k3s.yaml if remote admin needed
```

Postgres dump CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: apps
spec:
  # Run every day at 03:00.
  # Format is cron: minute hour day-of-month month day-of-week.
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          # For jobs, restart failed container but do not run forever.
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: postgres:16
              command:
                - sh
                - -c
                - |
                  # Dump database to dated SQL file.
                  pg_dump "$DATABASE_URL" > /backup/db-$(date +%F).sql
              envFrom:
                # DATABASE_URL comes from Secret.
                - secretRef:
                    name: postgres-backup-secret
              volumeMounts:
                # Store backup file in mounted backup volume.
                - name: backup
                  mountPath: /backup
          volumes:
            - name: backup
              persistentVolumeClaim:
                claimName: backup-pvc
```

Better: push backup to external object storage after dump.

Backup rule:

```txt
Data is not backed up until it exists outside the VM.
```

Reason:

```txt
If VPS disk dies or account is suspended, local backup PVC dies too.
External backup protects against whole-server loss.
```

Minimum restore drill:

```bash
# List backups.
ls -lh /backup

# Restore dump into test database.
psql "$TEST_DATABASE_URL" < /backup/db-YYYY-MM-DD.sql

# Confirm app can read restored data.
```

## 9. Streaming/Torrent Backend Notes

This section is for content you have rights to stream.

Vercel cannot reliably run persistent torrent/server streaming. VPS can.

Recommended architecture:

```txt
Next.js frontend on Vercel
-> HTTPS API on Oracle VPS
-> Node streamer Pod
-> persistent process while playback active
-> HTTP range endpoint
-> browser <video>
```

Streamer service requirements:

```txt
long-running Node process
range request support
cache directory PVC
file cleanup job
bandwidth guardrails
auth/rate limiting
```

Ingress annotations for streaming:

```yaml
# Allow long-lived streaming requests.
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"

# Allow long-lived response sending.
nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"

# Disable proxy buffering so stream bytes pass through immediately.
nginx.ingress.kubernetes.io/proxy-buffering: "off"
```

Resource example:

```yaml
resources:
  requests:
    # Scheduler reserves this much CPU for Pod.
    cpu: 250m
    # Scheduler reserves this much RAM.
    memory: 512Mi
  limits:
    # Pod can burst up to 2 CPU cores.
    cpu: 2000m
    # Pod is killed if memory goes above 4Gi.
    memory: 4096Mi
```

Cache cleanup CronJob:

```txt
delete files older than 24 hours
keep total cache under fixed GB limit
never let disk fill above 85%
```

Use direct streaming first. Avoid transcoding unless required. Transcoding burns CPU and can make free VPS unusable.

HTTP range basics:

```txt
Browser video player does not download whole file at once.
It asks server for byte ranges.
Example: Range: bytes=1000000-2000000
Server must return status 206 Partial Content.
Seeking creates new range requests.
```

Why Vercel failed but VPS works:

```txt
Vercel function starts per request and times out.
VPS process stays alive during playback.
Torrent/WebTorrent needs swarm state, cache, and open connections.
```

Cache guardrails:

```txt
set max cache size
delete old files
monitor disk
reject huge files if disk too low
rate-limit abusive clients
```

## 10. Observability

### 10.1 First Tools

Use built-in commands:

```bash
# Show all Pods across all namespaces.
kubectl get pods -A

# Show detailed Pod events, scheduling, probe failures, image errors.
kubectl describe pod POD_NAME -n apps

# Show recent logs from all Pods under stream-api Deployment.
kubectl logs -n apps deployment/stream-api --tail=200

# Show node CPU/RAM usage. Requires metrics-server.
kubectl top nodes

# Show Pod CPU/RAM usage.
kubectl top pods -A
```

Host tools:

```bash
# Interactive CPU/RAM/process viewer.
htop

# Show disk usage by filesystem.
df -h

# Show total size of k3s data directory.
du -sh /var/lib/rancher/k3s

# Follow k3s systemd logs.
sudo journalctl -u k3s -f
```

What to check first when app is down:

```txt
kubectl get pods -n apps
kubectl describe pod failing-pod -n apps
kubectl logs failing-pod -n apps --previous
kubectl get ingress -n apps
kubectl describe ingress app-name -n apps
```

### 10.2 Uptime Kuma

Deploy Uptime Kuma after core apps work.

Monitor:

```txt
https://api.example.com/health
https://stream.example.com/health
https://socket.example.com/health
disk space via push monitor
```

Protect admin UI with:

```txt
strong password
separate hostname
optional IP allowlist
```

Why Uptime Kuma:

```txt
It checks your public endpoints from outside app code.
It can alert when API is down.
It is simpler than Prometheus for first monitoring setup.
```

Suggested monitors:

```txt
HTTP monitor for every /health endpoint
TCP monitor for port 443
Push monitor from daily backup job
Push monitor from disk-space cron
```

### 10.3 Prometheus/Grafana Later

Do not install full monitoring stack on day one. It uses memory and adds many moving parts.

Add later:

```txt
kube-prometheus-stack
Prometheus
Grafana
Loki or Vector
```

Learning order:

```txt
kubectl logs
-> Uptime Kuma
-> metrics-server
-> Prometheus/Grafana
-> Loki
```

## 11. Security Baseline

### 11.1 Network

Rules:

```txt
Only 80/443 public
SSH only from your IP
Kubernetes API not public unless IP restricted
No public NodePort apps
No public database ports
```

### 11.2 Kubernetes RBAC

Single-user personal cluster can start with admin kubeconfig.

Learn RBAC later:

```txt
ServiceAccount
Role
RoleBinding
least privilege CI deploy user
```

What RBAC does:

```txt
RBAC decides who can do what inside Kubernetes.
Example: CI user can update Deployments in apps namespace, but cannot read Secrets in cert-manager.
```

Start simple:

```txt
Use admin kubeconfig while learning.
When CI/CD works, create limited deploy ServiceAccount.
```

### 11.3 Secrets

Bad:

```txt
commit Secret YAML with base64 values
put secrets in Docker image
put .env in git
```

Acceptable first step:

```bash
# Create Secret from command line.
# Values are stored in Kubernetes Secret object.
kubectl create secret generic app-secret ...
```

Better:

```txt
SOPS + age encrypted secrets in git
Sealed Secrets
External Secrets Operator
OCI Vault
```

### 11.4 Image Security

Use:

```txt
small base images
non-root user
npm ci
dependency scanning
no build secrets in final image
fixed tags or SHA digests for critical services
```

Why non-root container:

```txt
If app is exploited, attacker gets less power inside container.
It does not make app safe by itself, but reduces blast radius.
```

Why fixed tags:

```txt
latest can change without visible config change.
git SHA tag tells exactly what code is running.
rollback becomes precise.
```

## 12. Resource Planning For One Free VPS

Example 4 OCPU / 24 GB layout:

```txt
k3s system                1-2 GB RAM
ingress-nginx             256-512 MB
cert-manager              256-512 MB
3 small Node APIs          1-3 GB total
stream backend             1-4 GB depending workload
Postgres                   1-4 GB
Redis                      256 MB-1 GB
monitoring light           512 MB-2 GB
free headroom              keep 25-35%
```

Do not run everything without limits. One memory leak can kill node.

Use requests/limits for every app:

```txt
small API request: 100m CPU, 256Mi memory
small API limit:   500m CPU, 512Mi memory
stream request:    250m CPU, 512Mi memory
stream limit:      2000m CPU, 4096Mi memory
```

Watch:

```bash
# Show Pod resource usage.
kubectl top pods -A

# Show node resource usage.
kubectl top nodes

# Show host memory.
free -h

# Show host disk.
df -h
```

## 13. Learning Roadmap

### Phase 1: Server Foundation

Goal:

```txt
secure Oracle VPS
k3s running
kubectl works
ingress-nginx receives traffic
cert-manager issues cert
```

Deploy one hello app:

```txt
Deployment
Service
Ingress
TLS
```

### Phase 2: First Real Node Service

Goal:

```txt
containerize Node API
push image to GHCR
deploy with Kubernetes YAML
rollout restart
rollback
logs
health checks
```

### Phase 3: Multiple Services

Goal:

```txt
api.example.com
stream.example.com
socket.example.com
```

Learn:

```txt
namespaces
ConfigMaps
Secrets
resource limits
Ingress host routing
WebSocket routing
```

### Phase 4: Helm

Goal:

```txt
convert repeated YAML to one Helm chart
use values per service
deploy with helm upgrade --install
```

Chart structure:

```txt
charts/node-service/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    configmap.yaml
```

### Phase 5: CI/CD

Goal:

```txt
push main
-> tests
-> image build
-> push
-> deploy
-> rollout status
```

### Phase 6: Data And Backups

Goal:

```txt
Postgres in cluster
PVC
backup CronJob
restore test
```

### Phase 7: Observability

Goal:

```txt
Uptime Kuma
basic alerts
Prometheus/Grafana later
central logs later
```

## 14. Common Commands

Cluster:

```bash
# Show Kubernetes nodes.
kubectl get nodes -o wide

# Show all Pods in all namespaces.
kubectl get pods -A

# Show all Services.
kubectl get svc -A

# Show all Ingress rules.
kubectl get ingress -A

# Show TLS certificates managed by cert-manager.
kubectl get certificates -A
```

Debug app:

```bash
# Show Deployment config, rollout state, and events.
kubectl describe deployment stream-api -n apps

# Show Pod details: events, image pull errors, probe failures, node placement.
kubectl describe pod POD_NAME -n apps

# Show logs from one Pod.
kubectl logs POD_NAME -n apps

# Follow logs from all Pods in Deployment.
kubectl logs -f deployment/stream-api -n apps

# Open shell inside running Pod.
# Use only for debugging, not permanent fixes.
kubectl exec -it POD_NAME -n apps -- sh
```

Rollout:

```bash
# Wait for rollout to complete.
kubectl rollout status deployment/stream-api -n apps

# Show rollout revisions.
kubectl rollout history deployment/stream-api -n apps

# Undo to previous revision.
kubectl rollout undo deployment/stream-api -n apps
```

Ingress/cert:

```bash
# Show Ingress routing, annotations, and events.
kubectl describe ingress stream-api -n apps

# Show certificate status.
kubectl describe certificate stream-api-tls -n apps

# Show Let's Encrypt validation challenge state.
kubectl describe challenge -A

# cert-manager logs for certificate issues.
kubectl logs -n cert-manager deployment/cert-manager

# ingress-nginx logs for routing/proxy issues.
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

k3s service logs:

```bash
# Follow Kubernetes system logs on host.
sudo journalctl -u k3s -f
```

Disk:

```bash
# Show disk usage by mounted filesystem.
df -h

# Show total k3s directory size.
sudo du -sh /var/lib/rancher/k3s

# Show local-path storage size.
sudo du -sh /var/lib/rancher/k3s/storage
```

## 15. Failure Modes And Fixes

### 15.1 Domain Does Not Work

Check:

```bash
# Check DNS resolution.
dig api.example.com

# Check HTTP response headers.
curl -I http://api.example.com

# Check Kubernetes Ingress object exists.
kubectl get ingress -A

# Check ingress-nginx Service exists and has ports.
kubectl get svc -n ingress-nginx

# Check Linux firewall rules.
sudo ufw status
```

Likely causes:

```txt
DNS A record wrong
OCI port 80/443 closed
UFW port 80/443 closed
ingress-nginx not running
Ingress host mismatch
```

### 15.2 Certificate Not Issued

Check:

```bash
# See certificate status and errors.
kubectl describe certificate -A

# See ACME challenge status.
kubectl describe challenge -A

# See cert-manager controller logs.
kubectl logs -n cert-manager deployment/cert-manager
```

Likely causes:

```txt
HTTP port 80 blocked
DNS not pointed to VPS
wrong ingressClassName
Let's Encrypt rate limit
using prod issuer during testing
```

### 15.3 Pod CrashLoopBackOff

Check:

```bash
# Show logs from previous crashed container.
kubectl logs POD_NAME -n apps --previous

# Show events and restart reason.
kubectl describe pod POD_NAME -n apps
```

Likely causes:

```txt
missing env secret
wrong PORT
app binds localhost instead of 0.0.0.0
bad image architecture
startup too slow for liveness probe
```

For Node apps inside containers, bind:

```txt
0.0.0.0
```

not:

```txt
localhost
```

### 15.4 Image Pull Fails

Check:

```bash
# Events will say Unauthorized, NotFound, or architecture mismatch.
kubectl describe pod POD_NAME -n apps
```

Likely causes:

```txt
private GHCR image
missing imagePullSecret
wrong tag
ARM64 image missing
```

Build multi-arch if needed:

```bash
# Build ARM64 image for Oracle Ampere A1 and push to registry.
docker buildx build --platform linux/arm64 -t ghcr.io/YOUR_USER/app:tag --push .
```

### 15.5 Node Disk Full

Check:

```bash
# Show filesystem usage.
df -h

# Find largest directories/files.
sudo du -xh / | sort -h | tail -50
```

Clean:

```bash
# List container images known to k3s container runtime.
sudo k3s crictl images

# Remove unused images.
sudo k3s crictl rmi --prune
```

Remove old logs if needed:

```bash
# Keep only last 7 days of systemd journal logs.
sudo journalctl --vacuum-time=7d
```

For stream cache, create cleanup CronJob.

### 15.6 Service Returns 502/504

Meaning:

```txt
Ingress received request but backend did not respond correctly.
```

Check:

```bash
# Check Service points to Pods.
kubectl get endpoints stream-api -n apps

# Check Pods are Ready.
kubectl get pods -n apps

# Check app logs.
kubectl logs -n apps deployment/stream-api --tail=200

# Check ingress logs.
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=200
```

Likely causes:

```txt
Pod not Ready
Service selector does not match Pod labels
app listens on wrong port
app binds localhost instead of 0.0.0.0
readiness probe failing
backend request timeout
```

### 15.7 App Works Inside Cluster But Not Publicly

Test from inside cluster:

```bash
# Run temporary curl Pod.
kubectl run curl-test --rm -it --image=curlimages/curl -- sh

# Inside curl Pod, call Service.
curl http://stream-api.apps.svc.cluster.local/health
```

If internal works but public fails:

```txt
Ingress problem
DNS problem
TLS/certificate problem
OCI/UFW firewall problem
```

## 16. When To Add More Kubernetes Complexity

Do not install everything early.

Add only when pain appears:

```txt
Helm                 after 2-3 services repeat YAML
SOPS/SealedSecrets   after secrets become hard to track
Prometheus           after kubectl top/logs insufficient
Loki                 after logs across services become painful
Argo CD              after manual deploys become risky
External DNS         after many hostnames
MetalLB              after multi-node/bare-metal LB learning
Longhorn             after multi-node persistent storage need
```

Avoid for one-node first month:

```txt
service mesh
Istio
Linkerd
multi-cluster
full ELK stack
Kafka
overcomplicated GitOps
```

## 17. Best Practice Defaults

Use these defaults unless there is a reason not to:

```txt
Kubernetes distro:       k3s
Ingress controller:      ingress-nginx
TLS:                     cert-manager + Let's Encrypt
Package manager:         Helm
Container registry:      GHCR
Namespace:               apps
Service type:            ClusterIP
Public entrypoint:       Ingress only
Secrets v1:              kubectl create secret
Secrets v2:              SOPS or Sealed Secrets
Storage v1:              local-path PVC
Monitoring v1:           kubectl + Uptime Kuma
Monitoring v2:           Prometheus/Grafana
Deployment v1:           manual kubectl/helm
Deployment v2:           GitHub Actions
```

## 18. Separate Optimized Plan: Docker Compose + Caddy

This path is better if you want fewer moving parts and more practical uptime. It teaches less Kubernetes.

### 18.1 Optimized Architecture

```txt
Internet
-> DNS
-> Oracle public IP
-> OCI NSG/Security List
-> UFW
-> Caddy :80/:443
-> Docker network
-> Node containers
```

### 18.2 Why Caddy

Caddy automatically handles HTTPS and renewal. It is simpler than Nginx plus certbot.

Official docs:

- Caddy automatic HTTPS: https://caddyserver.com/docs/automatic-https
- Caddy reverse_proxy: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy

### 18.3 Folder Layout

```txt
/opt/apps/
  proxy/
    docker-compose.yml
    Caddyfile
  api/
    docker-compose.yml
    .env
  stream-api/
    docker-compose.yml
    .env
  socket-api/
    docker-compose.yml
    .env
```

### 18.4 Shared Docker Network

```bash
# Create shared Docker network.
# Caddy and app containers join same network.
# Then Caddy can reach containers by service name.
docker network create proxy
```

### 18.5 Caddy Compose

```yaml
services:
  caddy:
    # Official Caddy image.
    image: caddy:2
    # Restart after crash or server reboot.
    restart: unless-stopped
    ports:
      # Public HTTP.
      - "80:80"
      # Public HTTPS.
      - "443:443"
    volumes:
      # Mount Caddy routing config.
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      # Store certificates and ACME account data.
      - caddy_data:/data
      # Store Caddy runtime config.
      - caddy_config:/config
    networks:
      - proxy

volumes:
  # Docker-managed volume for cert data.
  caddy_data:
  caddy_config:

networks:
  proxy:
    # Use network created by docker network create proxy.
    external: true
```

### 18.6 Caddyfile

```txt
api.example.com {
  # Forward requests to container named api on port 3000.
  reverse_proxy api:3000
}

stream.example.com {
  # Forward requests to stream-api container on port 4000.
  reverse_proxy stream-api:4000
}

socket.example.com {
  # Forward requests to socket-api container on port 5000.
  reverse_proxy socket-api:5000
}
```

How Caddy knows certificates:

```txt
Caddy reads domain names from Caddyfile.
Caddy opens HTTP/HTTPS ports.
Caddy asks Let's Encrypt for certificate.
Caddy renews certificate automatically.
```

### 18.7 App Compose

```yaml
services:
  stream-api:
    # App image from registry.
    image: ghcr.io/YOUR_USER/stream-api:latest
    # Restart on crash and after reboot.
    restart: unless-stopped
    # Load environment variables from local file.
    env_file:
      - .env
    # Expose only to Docker network, not public host port.
    expose:
      - "4000"
    networks:
      - proxy
    volumes:
      # Persistent cache volume mounted inside container.
      - stream_cache:/data/cache

volumes:
  # Docker-managed volume.
  stream_cache:

networks:
  proxy:
    # Join shared proxy network.
    external: true
```

### 18.8 Compose Deploy

```bash
# Go to service folder.
cd /opt/apps/stream-api

# Pull newer image from registry.
docker compose pull

# Start/recreate containers in background.
docker compose up -d

# Follow recent logs.
docker compose logs -f --tail=100
```

Compose mental model:

```txt
docker compose.yml describes containers.
docker compose up -d makes running containers match file.
Caddy is public entrypoint.
App containers stay private on Docker network.
```

### 18.9 Compose Pros And Cons

Pros:

```txt
less memory
less setup
easier debugging
faster deploys
automatic HTTPS with Caddy
best practical choice for one VPS
```

Cons:

```txt
less Kubernetes learning
manual service discovery
manual rollout/rollback
less declarative cluster model
weaker scaling story
```

## 19. Which Path To Use

Use Kubernetes path when:

```txt
learning DevOps matters
you want ingress, cert-manager, deployments, services, probes, Helm
you accept more complexity
you want experience transferable to real clusters
```

Use Compose/Caddy path when:

```txt
you only need personal production hosting
you want least maintenance
you have one VPS
you do not need Kubernetes practice
```

Best combined approach:

```txt
Use Kubernetes for learning and main backend services.
Keep Compose/Caddy notes as fallback.
If Kubernetes becomes too much, switch production services to Compose but keep k3s lab separately.
```

## 20. Final Recommended Build Order

1. Create Oracle A1 VPS with Ubuntu ARM64, 4 OCPU / 24 GB if possible.
2. Reserve public IP and point test domain to it.
3. Harden SSH, UFW, fail2ban.
4. Install k3s with Traefik disabled.
5. Install Helm.
6. Install ingress-nginx.
7. Install cert-manager.
8. Deploy hello app with TLS.
9. Deploy first Node API with Deployment, Service, Ingress, ConfigMap, Secret.
10. Add health checks and resource limits.
11. Add second and third services.
12. Convert repeated YAML into Helm chart.
13. Add GitHub Actions deploy.
14. Add backups.
15. Add Uptime Kuma.
16. Add Prometheus/Grafana only after basics are stable.
