

import sys
from pathlib import Path

# Permite importar desde app/ aunque este script viva en scripts/
sys.path.append(str(Path(__file__).resolve().parent.parent))

import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from app.utils.preprocessing import FEATURE_NAMES
from app.core.config import settings

# Generamos datos sintéticos con la MISMA cantidad de columnas
# que produce preprocessing.build_feature_vector(), para que el
# modelo "sepa" interpretar ese vector cuando llegue una petición real.
rng = np.random.default_rng(seed=42)
n_samples = 500
n_features = len(FEATURE_NAMES)

X = rng.normal(loc=0, scale=1, size=(n_samples, n_features))
# Etiqueta sintética: 1 = riesgo alto, 0 = riesgo bajo, con una regla
# simple solo para que el modelo tenga algo coherente que aprender.
y = (X[:, 2] < 0).astype(int)  # índice 2 = "net_cashflow": negativo -> riesgo

model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42,
)
model.fit(X, y)

settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
output_path = settings.MODELS_DIR / settings.DEFAULT_MODEL_NAME
joblib.dump(model, output_path)

print(f"Modelo dummy guardado en: {output_path}")
