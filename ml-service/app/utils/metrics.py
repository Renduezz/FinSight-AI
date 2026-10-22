from sklearn.metrics import accuracy_score


def compute_accuracy(y_true, y_pred) -> float:
    return float(accuracy_score(y_true, y_pred))


def compute_feature_importances(model, feature_names: list[str]) -> dict[str, float]:
    importances = model.feature_importances_
    return {name: round(float(importance), 4) for name, importance in zip(feature_names, importances)}