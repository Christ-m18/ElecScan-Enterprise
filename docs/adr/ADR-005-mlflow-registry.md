# ADR-005 MLflow para registry y tracking

Status: Accepted
Date: 2026-06-08

## Contexto

Necesitamos registry de modelos, tracking de experimentos y artifact store.

## Decision

MLflow self-hosted con backend Postgres + artifacts en MinIO/S3.

## Justificacion

- Standard de la industria.
- Integra con Airflow para pipelines de entrenamiento.
- Compatible con Triton / ONNX serving.

## Consecuencias

- Otro servicio en el stack. Aceptado.
