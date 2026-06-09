# Lefthook setup (manual, una sola vez)

El sandbox que genero este monorepo bloquea la escritura directa de archivos
`lefthook.yml` o `.lefthook.yml` en la raiz. El contenido de la configuracion
queda documentado aqui. Al clonar el repositorio, copia el bloque siguiente a
`lefthook.yml` en la raiz y corre `pnpm prepare`.

## Contenido de `lefthook.yml`

```yaml
pre-commit:
  parallel: true
  commands:
    biome-check:
      glob: "*.{ts,tsx,js,jsx,json,css}"
      run: pnpm exec biome check --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}

commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}

pre-push:
  parallel: false
  commands:
    typecheck:
      run: pnpm typecheck
    test:
      run: pnpm test
```

## Activacion

```
# crear el archivo (copiar el contenido de arriba)
$EDITOR lefthook.yml

pnpm install
pnpm prepare
```

`pnpm prepare` ejecuta `lefthook install` y deja los hooks activos en `.git/hooks/`.

## Verificacion

```
pnpm exec lefthook run pre-commit
pnpm exec lefthook run pre-push
```

Ambas tareas deben terminar exit code 0 en una rama limpia.
