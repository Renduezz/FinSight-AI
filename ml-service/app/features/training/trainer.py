

from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split

from app.utils.metrics import compute_accuracy, compute_feature_importances
from app.utils.validators import validate_minimum_class_balance, validate_no_missing_values


# Hiperparámetros del Gradient Boosting.
# Se dejan como constantes documentadas aquí (y no "mágicamente"
# dentro de la función) para que sea fácil ajustarlos durante los
# experimentos de tu tesis y justificar la elección en el informe.
GB_HYPERPARAMETERS = {
    "n_estimators": 150,      # Número de árboles secuenciales
    "learning_rate": 0.1,     # Qué tanto corrige cada árbol al anterior
    "max_depth": 3,           # Profundidad máxima de cada árbol (controla overfitting)
    "random_state": 42,       # Semilla fija -> resultados reproducibles
}

TEST_SIZE = 0.2  # 20% de los datos se reservan para evaluar, no para entrenar


def train_gradient_boosting(X: pd.DataFrame, y: pd.Series) -> tuple[GradientBoostingClassifier, dict]:

    # --- Validaciones de calidad de datos antes de gastar tiempo entrenando ---
    validate_no_missing_values(X)
    validate_minimum_class_balance(y.values)

    # --- División train/test ---
    # stratify=y asegura que la PROPORCIÓN de cada clase se mantenga
    # igual tanto en train como en test; crítico cuando las clases
    # están desbalanceadas (como suele pasar con "riesgo financiero").
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=GB_HYPERPARAMETERS["random_state"],
    )

    model = GradientBoostingClassifier(**GB_HYPERPARAMETERS)
    model.fit(X_train, y_train)

    # --- Métricas ---
    train_accuracy = compute_accuracy(y_train, model.predict(X_train))
    test_accuracy = compute_accuracy(y_test, model.predict(X_test))
    feature_importances = compute_feature_importances(model, list(X.columns))

    metrics = {
        "n_samples": len(X),
        "train_accuracy": train_accuracy,
        "test_accuracy": test_accuracy,
        "feature_importances": feature_importances,
        "trained_at": datetime.utcnow(),
    }

    # Alerta "silenciosa" de overfitting: si el modelo es mucho mejor
    # en train que en test, probablemente está memorizando en vez de
    # generalizar. No lo convertimos en un error duro (podría ser
    # normal con pocos datos), pero vale la pena que lo discutas
    # en el análisis de resultados de tu tesis.
    if train_accuracy - test_accuracy > 0.25:
        metrics["overfitting_warning"] = True

    return model, metrics
