import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import TransactionPayload, EvaluationResponse, ShapFeature
from ml_service import load_artifacts, evaluate_transaction, get_model_status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load ML artifacts
    result = load_artifacts()
    logger.info(f'Model status on startup: {result}')
    yield
    # Shutdown cleanup (if needed)
    logger.info('SentinelRisk API shutting down.')

app = FastAPI(
    title='SentinelRisk API',
    description='Real-time fraud detection API powered by LightGBM + SHAP explainability',
    version='1.0.0',
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # Lock down in production
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get('/api/health', tags=['Monitoring'])
def health_check():
    """Returns API health and model loading status."""
    status = get_model_status()
    return {
        'status': 'ok',
        'service': 'SentinelRisk Fraud Detection API',
        'version': '1.0.0',
        'model_status': status
    }

@app.post('/api/evaluate', response_model=EvaluationResponse, tags=['Fraud Detection'])
def evaluate(payload: TransactionPayload):
    """
    Evaluate a transaction for fraud risk.
    
    Accepts transaction features and returns:
    - fraud_probability: float between 0 and 1
    - prediction: 'Fraud' or 'Legitimate'
    - shap_values: list of feature impact values explaining the prediction
    - model_mode: 'live' (real model) or 'mock' (fallback)
    """
    try:
        data = payload.model_dump(by_alias=True)
        result = evaluate_transaction(data)
        return EvaluationResponse(
            fraud_probability=result['fraud_probability'],
            prediction=result['prediction'],
            shap_values=[
                ShapFeature(feature=sv['feature'], impact=sv['impact'])
                for sv in result['shap_values']
            ],
            model_mode=result['model_mode']
        )
    except Exception as e:
        logger.error(f'Evaluation error: {e}')
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
