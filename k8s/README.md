# Kubernetes Deployment Guide

Este diretório contém todos os manifestos Kubernetes necessários para fazer deploy da aplicação LegalConnect.

## 📋 Pré-requisitos

- Cluster Kubernetes (1.24+)
- `kubectl` configurado e conectado ao cluster
- Docker registry para a imagem da aplicação
- Ingress Controller instalado (nginx, traefik, etc.)
- Cert-Manager (opcional, para SSL automático)

## 📁 Estrutura de Arquivos

```
k8s/
├── namespace.yaml              # Namespace do projeto
├── configmap.yaml              # Configurações não-sensíveis
├── secrets.yaml.example        # Template de secrets (NUNCA commitar secrets reais!)
├── postgres-deployment.yaml    # PostgreSQL StatefulSet + Service
├── redis-deployment.yaml       # Redis StatefulSet + Service
├── app-deployment.yaml         # Aplicação Next.js + Service + PVC
├── ingress.yaml                # Ingress para expor a aplicação
├── hpa.yaml                    # Horizontal Pod Autoscaler
├── job-migrate.yaml            # Job para rodar migrações do Prisma
├── kustomization.yaml          # Kustomize para gerenciar recursos
└── README.md                   # Este arquivo
```

## 🚀 Deploy Passo a Passo

### 1. Criar Secrets

**⚠️ IMPORTANTE**: Nunca commite secrets reais no repositório!

```bash
# Criar secrets via kubectl
kubectl create secret generic legalconnect-secrets \
  --from-literal=POSTGRES_PASSWORD='sua-senha-segura' \
  --from-literal=REDIS_PASSWORD='sua-senha-redis' \
  --from-literal=NEXTAUTH_SECRET='seu-secret-nextauth-min-32-chars' \
  --from-literal=RESEND_API_KEY='sua-resend-key' \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY='sua-supabase-key' \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL='https://seu-projeto.supabase.co' \
  --namespace=legalconnect \
  --dry-run=client -o yaml | kubectl apply -f -
```

Ou use um gerenciador de secrets (AWS Secrets Manager, HashiCorp Vault, etc.) e crie um Secret externo.

### 2. Ajustar ConfigMap

Edite `configmap.yaml` e ajuste:
- `NEXTAUTH_URL`: URL pública da aplicação
- Outras configurações conforme necessário

### 3. Build e Push da Imagem Docker

```bash
# Build da imagem
docker build -t legalconnect-app:latest .

# Tag para seu registry
docker tag legalconnect-app:latest your-registry/legalconnect-app:v1.0.0

# Push para o registry
docker push your-registry/legalconnect-app:v1.0.0
```

### 4. Atualizar Imagem no Deployment

Edite `app-deployment.yaml` e atualize a linha:
```yaml
image: your-registry/legalconnect-app:v1.0.0
```

### 5. Aplicar Manifestos

```bash
# Criar namespace
kubectl apply -f namespace.yaml

# Aplicar ConfigMap
kubectl apply -f configmap.yaml

# Aplicar Secrets (se criou via arquivo)
# kubectl apply -f secrets.yaml

# Aplicar PostgreSQL
kubectl apply -f postgres-deployment.yaml

# Aplicar Redis
kubectl apply -f redis-deployment.yaml

# Aguardar PostgreSQL e Redis estarem prontos
kubectl wait --for=condition=ready pod -l app=postgres -n legalconnect --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n legalconnect --timeout=300s

# Rodar migrações do banco
kubectl apply -f job-migrate.yaml
kubectl wait --for=condition=complete job/legalconnect-migrate -n legalconnect --timeout=300s

# Aplicar aplicação
kubectl apply -f app-deployment.yaml

# Aplicar Ingress
kubectl apply -f ingress.yaml

# Aplicar HPA (opcional)
kubectl apply -f hpa.yaml
```

### 6. Verificar Deploy

```bash
# Ver pods
kubectl get pods -n legalconnect

# Ver serviços
kubectl get svc -n legalconnect

# Ver logs da aplicação
kubectl logs -f deployment/legalconnect-app -n legalconnect

# Verificar ingress
kubectl get ingress -n legalconnect
```

## 🔧 Usando Kustomize

Para gerenciar diferentes ambientes (dev, staging, prod):

```bash
# Aplicar tudo de uma vez
kubectl apply -k k8s/

# Ou com kustomize
kubectl kustomize k8s/ | kubectl apply -f -
```

## 📊 Monitoramento

### Ver Status dos Pods

```bash
kubectl get pods -n legalconnect -w
```

### Ver Logs

```bash
# App
kubectl logs -f deployment/legalconnect-app -n legalconnect

# PostgreSQL
kubectl logs -f statefulset/postgres -n legalconnect

# Redis
kubectl logs -f statefulset/redis -n legalconnect
```

### Ver Recursos

```bash
kubectl top pods -n legalconnect
kubectl top nodes
```

## 🔄 Atualizações

### Atualizar Aplicação

```bash
# Método 1: Atualizar imagem no deployment
kubectl set image deployment/legalconnect-app \
  app=your-registry/legalconnect-app:v1.1.0 \
  -n legalconnect

# Método 2: Editar deployment e reaplicar
kubectl edit deployment legalconnect-app -n legalconnect

# Verificar rollout
kubectl rollout status deployment/legalconnect-app -n legalconnect
```

### Rodar Migrações Novamente

```bash
# Deletar job anterior (se existir)
kubectl delete job legalconnect-migrate -n legalconnect --ignore-not-found

# Aplicar job de migração
kubectl apply -f job-migrate.yaml

# Aguardar conclusão
kubectl wait --for=condition=complete job/legalconnect-migrate -n legalconnect --timeout=300s
```

## 🗄️ Backup e Restore

### Backup PostgreSQL

```bash
# Criar backup
kubectl exec -it postgres-0 -n legalconnect -- \
  pg_dump -U legalconnect legalconnect > backup-$(date +%Y%m%d).sql

# Ou usar um job
kubectl run postgres-backup --image=postgres:15-alpine \
  --restart=Never --rm -it \
  --env="PGPASSWORD=$(kubectl get secret legalconnect-secrets -n legalconnect -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)" \
  -- sh -c "pg_dump -h postgres-service -U legalconnect legalconnect" > backup.sql
```

### Restore PostgreSQL

```bash
kubectl exec -i postgres-0 -n legalconnect -- \
  psql -U legalconnect legalconnect < backup.sql
```

## 🔒 Segurança

### Rotacionar Secrets

```bash
# Atualizar secret
kubectl create secret generic legalconnect-secrets \
  --from-literal=POSTGRES_PASSWORD='nova-senha' \
  --namespace=legalconnect \
  --dry-run=client -o yaml | kubectl apply -f -

# Reiniciar pods para pegar novo secret
kubectl rollout restart deployment/legalconnect-app -n legalconnect
```

### RBAC (Role-Based Access Control)

Crie roles e rolebindings conforme necessário para limitar acesso.

## 📈 Escalabilidade

O HPA (Horizontal Pod Autoscaler) está configurado para escalar automaticamente baseado em CPU e memória:

- **Min replicas**: 2
- **Max replicas**: 10
- **CPU target**: 70%
- **Memory target**: 80%

Ajuste conforme necessário em `hpa.yaml`.

## 🐛 Troubleshooting

### Pod não inicia

```bash
# Ver eventos
kubectl describe pod <pod-name> -n legalconnect

# Ver logs
kubectl logs <pod-name> -n legalconnect

# Verificar recursos
kubectl top pod <pod-name> -n legalconnect
```

### Problemas de conexão com banco

```bash
# Testar conexão
kubectl run postgres-client --image=postgres:15-alpine \
  --restart=Never --rm -it \
  --env="PGPASSWORD=$(kubectl get secret legalconnect-secrets -n legalconnect -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)" \
  -- psql -h postgres-service -U legalconnect -d legalconnect
```

### Problemas de ingress

```bash
# Verificar ingress
kubectl describe ingress legalconnect-ingress -n legalconnect

# Verificar ingress controller
kubectl get pods -n ingress-nginx
```

## 🔄 CI/CD com GitHub Actions

Um workflow de exemplo está em `.github/workflows/deploy-k8s.yml`.

Configure os secrets no GitHub:
- `KUBECONFIG`: Config do Kubernetes (base64 encoded)

## 📝 Notas Importantes

1. **Storage**: Ajuste `storageClassName` nos PVCs conforme seu cluster
2. **Ingress**: Ajuste `ingressClassName` e annotations conforme seu ingress controller
3. **Resources**: Ajuste requests/limits conforme suas necessidades
4. **Replicas**: Ajuste número de réplicas conforme carga esperada
5. **SSL**: Configure cert-manager ou use secrets para TLS

## 🚨 Produção

Antes de fazer deploy em produção:

- [ ] Alterar todas as senhas padrão
- [ ] Configurar backup automático do PostgreSQL
- [ ] Configurar monitoramento (Prometheus, Grafana)
- [ ] Configurar logging centralizado (ELK, Loki)
- [ ] Configurar alertas
- [ ] Revisar limites de recursos
- [ ] Configurar network policies
- [ ] Habilitar Pod Security Standards
- [ ] Configurar resource quotas
- [ ] Testar disaster recovery

## 📚 Recursos Adicionais

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize](https://kustomize.io/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/security/best-practices/)
