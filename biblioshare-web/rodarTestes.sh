#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Executando testes Django para os módulos livros, transacoes e usuarios..."
python manage.py test livros transacoes usuarios --verbosity 2 "$@"