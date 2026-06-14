{{/*
Expand the name of the chart.
*/}}
{{- define "elecscan.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Full name for a given service component.
Usage: {{ include "elecscan.fullname" (dict "svc" "api-gateway" "root" .) }}
*/}}
{{- define "elecscan.fullname" -}}
{{- printf "%s-%s" (include "elecscan.name" .root) .svc | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "elecscan.labels" -}}
helm.sh/chart: {{ .root.Chart.Name }}-{{ .root.Chart.Version }}
app.kubernetes.io/name: {{ include "elecscan.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/version: {{ .root.Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
app.kubernetes.io/component: {{ .svc }}
app.kubernetes.io/part-of: elecscan
{{- end }}

{{/*
Selector labels
*/}}
{{- define "elecscan.selectorLabels" -}}
app.kubernetes.io/name: {{ include "elecscan.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .svc }}
{{- end }}

{{/*
Image reference for a service
*/}}
{{- define "elecscan.image" -}}
{{- printf "%s/%s:%s" .root.Values.global.image.registry .svc .root.Values.global.image.tag }}
{{- end }}
