from pydantic import BaseModel, Field
from typing import Optional, List

class TransactionPayload(BaseModel):
    # Core transaction fields matching IBM dataset after preprocessing
    amount: float = Field(..., description="Transaction amount in USD", example=127.43)
    hour: int = Field(..., ge=0, le=23, description="Hour of transaction (0-23)", example=14)
    minute: int = Field(..., ge=0, le=59, description="Minute of transaction (0-59)", example=32)
    mcc: int = Field(..., description="Merchant Category Code", example=5411)
    
    # One-hot encoded fields for Use Chip
    use_chip_chip_transaction: int = Field(0, alias="use_chip_Chip Transaction", description="1 if chip was used", example=1)
    use_chip_online_transaction: int = Field(0, alias="use_chip_Online Transaction", description="1 if online transaction")
    use_chip_swipe_transaction: int = Field(0, alias="use_chip_Swipe Transaction", description="1 if swiped")
    
    # One-hot encoded fields for Errors
    errors_insufficient_balance: int = Field(0, alias="errors_Insufficient Balance", description="1 if insufficient balance error")
    errors_bad_pin: int = Field(0, alias="errors_Bad PIN", description="1 if bad PIN error")
    errors_technical_glitch: int = Field(0, alias="errors_Technical Glitch", description="1 if technical glitch")
    
    model_config = {"populate_by_name": True}

class ShapFeature(BaseModel):
    feature: str
    impact: float

class EvaluationResponse(BaseModel):
    fraud_probability: float = Field(..., description="Probability of fraud (0.0 - 1.0)")
    prediction: str = Field(..., description="'Fraud' or 'Legitimate'")
    shap_values: List[ShapFeature]
    model_mode: str = Field(..., description="'live' or 'mock'")
