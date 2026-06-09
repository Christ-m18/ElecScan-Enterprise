# ADR-004 OPA como policy engine

Status: Accepted
Date: 2026-06-08
Deciders: Tech Lead

## Contexto

Necesitamos RBAC + ABAC declarativo, externalizable, auditable.

## Decision

Open Policy Agent (OPA) con politicas Rego. Despliegue como sidecar en K8s y como libreria embebida (`@open-policy-agent/opa-wasm`) en algunos servicios.

## Justificacion

- Rego es expressive para ABAC.
- Mantenimiento maduro CNCF.
- Decoupling total entre app y policy.
- Casbin evaluado: simple pero menos expressive para ABAC contextual.
- Cerbos evaluado: bueno pero menos ecosystem.

## Consecuencias

- Curva de aprendizaje Rego. Mitigacion: libreria de helpers + guias.
- Cold start de policies cacheado.
