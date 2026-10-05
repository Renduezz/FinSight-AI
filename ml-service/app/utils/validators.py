"""
utils/validators.py
-----------------------
Validaciones que van MÁS ALLÁ de lo que Pydantic puede expresar
declarativamente en schemas.py. Mientras que schemas.py valida la
FORMA de los datos (tipos, rangos), este archivo valida la CALIDAD
estadística del dataset de entrenamiento como conjunto.

Se mantienen separadas de trainer.py para poder testear cada regla
de forma aislada y para que trainer.py se lea como una receta clara
de pasos, sin mezclar "matemática de ML" con "reglas de sanidad de datos".
"""

import numpy as np
from app.core.exceptions import InvalidTransactionDataError


def validate_minimum_class_balance(y: np.ndarray, min_ratio: float = 0.05) -> None:
    """
    Verifica que la clase minoritaria represente al menos `min_ratio`
    del dataset (por defecto 5%). Con un desbalance más extremo que
    eso, GradientBoostingClassifier tiende a "aprender" simplemente
    a predecir siempre la clase mayoritaria, lo cual sería inútil
    para el negocio (nunca detectaría el riesgo real).

    Nota: el schema TrainingRequest ya garantiza que existan AMBAS
    clases; esta función va un paso más allá y valida la PROPORCIÓN.
    """
    n_total = len(y)
    n_minority = min(np.sum(y == 0), np.sum(y == 1))
    ratio = n_minority / n_total

    if ratio < min_ratio:
        raise InvalidTransactionDataError(
            f"Desbalance de clases demasiado alto: la clase minoritaria "
            f"representa solo el {ratio:.1%} de las muestras "
            f"(mínimo aceptado: {min_ratio:.0%}). Se necesitan más ejemplos "
            f"de la clase menos frecuente para entrenar un modelo confiable."
        )


def validate_no_missing_values(X) -> None:
    """
    Un GradientBoostingClassifier de scikit-learn NO acepta valores NaN
    (a diferencia de XGBoost/LightGBM, que sí los manejan nativamente).
    Como preprocessing.py puede generar NaN en `expense_to_income_ratio`
    (empresas sin ingresos en el periodo), se valida esto ANTES de
    entrenar, con un mensaje de error claro en vez de dejar que
    scikit-learn falle con un error críptico.
    """
    if X.isna().any().any():
        columnas_con_nan = X.columns[X.isna().any()].tolist()
        raise InvalidTransactionDataError(
            f"Las siguientes columnas de features contienen valores nulos "
            f"y deben resolverse antes de entrenar: {columnas_con_nan}. "
            f"Common cause: empresas sin ingresos o sin gastos en el periodo."
        )
