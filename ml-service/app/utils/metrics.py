"""
utils/metrics.py
-------------------
Funciones pequeñas y puras para calcular métricas de calidad del modelo.
Se separan de trainer.py para poder reutilizarlas también si más
adelante construyes un endpoint de "evaluación" o un reporte periódico
de desempeño del modelo en producción (data drift, por ejemplo).
"""

from sklearn.metrics import accuracy_score
import numpy as np


def compute_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Accuracy = proporción de predicciones correctas sobre el total.

    NOTA PARA TU TESIS: accuracy es fácil de interpretar pero puede
    ser engañosa si las clases están desbalanceadas (ej. 90% de las
    empresas nunca tienen riesgo). Si ese es tu caso, documenta también
    precision/recall/F1 o AUC-ROC en tu informe final; deja aquí el
    espacio para agregar esas funciones cuando las necesites:

        from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
    """
    return float(accuracy_score(y_true, y_pred))


def compute_feature_importances(model, feature_names: list[str]) -> dict[str, float]:
    """
    GradientBoostingClassifier expone `.feature_importances_`: qué tanto
    contribuyó cada variable, en promedio, a reducir el error del modelo
    durante el entrenamiento (distinto de SHAP, que explica UNA predicción
    puntual; esto describe el modelo en general).
    """
    importances = model.feature_importances_
    return {
        name: round(float(importance), 4)
        for name, importance in zip(feature_names, importances)
    }
