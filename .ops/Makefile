helm install ingress-nginx ingress-nginx/ingress-nginx --version "4.8.0" \
  --namespace ingress-nginx \
  --create-namespace \
  -f ".ops/ternent/manifests/nginx-values-v4.8.0.yaml"


kubectl create ns backend

kubectl apply -f .ops/ternent/manifests/ternent_api_deployment.yaml
kubectl apply -f .ops/ternent/manifests/ternent_api_service.yaml

kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

## Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

## Install the cert-manager helm chart
helm install ternent --namespace cert-manager --version v1.13.0 jetstack/cert-manager

kubectl apply -f .ops/ternent/manifests/cert_manager_issuer.yaml

kubectl apply -f .ops/ternent/manifests/ternent_api_host.yaml
kubectl apply -f .ops/ternent/manifests/ternent_staging_host.yaml