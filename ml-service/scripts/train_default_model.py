import sys
import json
from pathlib import Path

# Permite importar desde app/ aunque este script viva en scripts/
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.features.training.schemas import TrainingRequest
from app.features.training.service import train_model

payload_path = Path(__file__).resolve().parent.parent / "data" / "training_payload_default.json"
with open(payload_path, "r", encoding="utf-8") as f:
    raw = json.load(f)

request = TrainingRequest.model_validate(raw)
response = train_model(request)

print(f"Modelo por defecto entrenado: {response.model_version}")
print(f"Muestras: {response.n_samples}, train_accuracy: {response.train_accuracy}, test_accuracy: {response.test_accuracy}")