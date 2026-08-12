import os
import logging
import random
import numpy as np
import pandas as pd
from typing import Optional

# shap requires llvmlite which can be large — degrade gracefully if not installed
try:
    import shap as _shap_module
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    logging.getLogger(__name__).warning("⚠️  shap not installed — SHAP values will use mock fallback")

logger = logging.getLogger(__name__)

MODEL = None
EXPLAINER = None
MOCK_MODE = False
FEATURE_NAMES = [
    'Amount', 'Hour', 'Minute', 'MCC',
    'Use Chip_Chip Transaction', 'Use Chip_Online Transaction', 'Use Chip_Swipe Transaction',
    'Errors?_Insufficient Balance', 'Errors?_Bad PIN', 'Errors?_Technical Glitch'
]

def load_artifacts() -> dict:
    global MODEL, EXPLAINER, MOCK_MODE
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(backend_dir, 'lgbm_ibm_fraud_model.pkl')
    explainer_path = os.path.join(backend_dir, 'shap_ibm_explainer.pkl')
    
    try:
        import joblib
        MODEL = joblib.load(model_path)
        EXPLAINER = joblib.load(explainer_path)
        MOCK_MODE = False
        logger.info('✅ ML artifacts loaded successfully')
        return {'status': 'live', 'message': 'Model and SHAP explainer loaded'}
    except FileNotFoundError as e:
        MOCK_MODE = True
        logger.warning(f'⚠️  Model files not found — running in MOCK mode. ({e})')
        return {'status': 'mock', 'message': 'Running in mock mode — .pkl files not found'}
    except Exception as e:
        MOCK_MODE = True
        logger.error(f'❌ Error loading artifacts: {e}')
        return {'status': 'mock', 'message': f'Error loading model: {str(e)}'}

def _mock_evaluate(data: dict) -> dict:
    """Return plausible random fraud evaluation for UI development."""
    random.seed(hash(str(data.get('amount', 0))))
    prob = random.uniform(0.05, 0.97)
    shap_vals = []
    mock_impacts = {
        'Amount': random.uniform(-0.3, 0.5),
        'Hour': random.uniform(-0.2, 0.3),
        'MCC': random.uniform(-0.15, 0.25),
        'Use Chip_Online Transaction': random.uniform(-0.1, 0.4),
        'Use Chip_Swipe Transaction': random.uniform(-0.2, 0.1),
        'Use Chip_Chip Transaction': random.uniform(-0.3, 0.05),
        'Errors?_Bad PIN': random.uniform(0.0, 0.35),
        'Errors?_Insufficient Balance': random.uniform(0.0, 0.2),
        'Minute': random.uniform(-0.05, 0.08),
        'Errors?_Technical Glitch': random.uniform(-0.05, 0.15),
    }
    shap_vals = [
        {'feature': k, 'impact': round(v, 4)}
        for k, v in sorted(mock_impacts.items(), key=lambda x: abs(x[1]), reverse=True)
    ]
    return {
        'fraud_probability': round(prob, 4),
        'prediction': 'Fraud' if prob >= 0.5 else 'Legitimate',
        'shap_values': shap_vals,
        'model_mode': 'mock'
    }

def evaluate_transaction(data: dict) -> dict:
    global MODEL, EXPLAINER, MOCK_MODE
    
    if MOCK_MODE or MODEL is None:
        return _mock_evaluate(data)
    
    try:
        # Build DataFrame with expected feature order
        row = {
            'Amount': data.get('amount', 0.0),
            'Hour': data.get('hour', 12),
            'Minute': data.get('minute', 0),
            'MCC': data.get('mcc', 5411),
            'Use Chip_Chip Transaction': data.get('use_chip_Chip Transaction', 0),
            'Use Chip_Online Transaction': data.get('use_chip_Online Transaction', 0),
            'Use Chip_Swipe Transaction': data.get('use_chip_Swipe Transaction', 1),
            'Errors?_Insufficient Balance': data.get('errors_Insufficient Balance', 0),
            'Errors?_Bad PIN': data.get('errors_Bad PIN', 0),
            'Errors?_Technical Glitch': data.get('errors_Technical Glitch', 0),
        }
        df = pd.DataFrame([row])
        
        # Predict
        proba = MODEL.predict_proba(df)[0][1]
        
        # SHAP values
        shap_vals_raw = EXPLAINER.shap_values(df)
        # For binary classification, shap_values may be a list [class0_vals, class1_vals]
        if isinstance(shap_vals_raw, list):
            fraud_shap = shap_vals_raw[1][0]
        else:
            fraud_shap = shap_vals_raw[0]
        
        shap_features = [
            {'feature': name, 'impact': round(float(val), 4)}
            for name, val in zip(df.columns.tolist(), fraud_shap)
        ]
        shap_features.sort(key=lambda x: abs(x['impact']), reverse=True)
        
        return {
            'fraud_probability': round(float(proba), 4),
            'prediction': 'Fraud' if proba >= 0.5 else 'Legitimate',
            'shap_values': shap_features,
            'model_mode': 'live'
        }
    except Exception as e:
        logger.error(f'Prediction error: {e}')
        return _mock_evaluate(data)

def get_model_status() -> dict:
    return {
        'mode': 'mock' if MOCK_MODE else 'live',
        'model_loaded': MODEL is not None,
        'explainer_loaded': EXPLAINER is not None
    }
