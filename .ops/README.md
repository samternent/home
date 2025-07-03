```bash
helm install ingress-nginx ingress-nginx/ingress-nginx --version "4.8.0" \
  --namespace ingress-nginx \
  --create-namespace \
  -f ".ops/manifests/nginx-values-v4.8.0.yaml"
```

```bash
kubectl create ns backend
```

```bash
kubectl apply -f .ops/ternent-api/deployment.yaml,.ops/ternent-api/service.yaml
```

```bash
kubectl apply -f .ops/ternent-api/deployment.yaml,.ops/ternent-api/service.yaml
```

```bash
kubectl apply -f .ops/footballsocial-api/deployment.yaml,.ops/footballsocial-api/service.yaml
```

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

## Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

## Install the cert-manager helm chart
helm install ternent --namespace cert-manager --version v1.13.0 jetstack/cert-manager
```

```bash
kubectl apply -f .ops/manifests/cert-manager-issuer.yaml
```

```bash
kubectl apply -f .ops/ternent-api/host.yaml
kubectl apply -f .ops/ternent-api/host.yaml
kubectl apply -f .ops/footballsocial-api/host.yaml
```

kubectl patch deployment ingress-nginx-controller -n ingress-nginx --patch "$(cat .ops/manifests/nginx-ingress-controller-patch.yaml)"

kubectl patch service ingress-nginx-controller -n ingress-nginx --patch "$(cat .ops/manifests/nginx-ingress-svc-controller-patch.yaml)"
