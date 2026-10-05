
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from app.features.financial_analysis.schemas import FinancialSummaryResponse
from app.features.financial_analysis.csv_parser import parse_csv_bytes
from app.features.financial_analysis.service import build_financial_summary

router = APIRouter(
    prefix="/financial-analysis",
    tags=["Financial Analysis (Dev/Test only - migrar a Spring Boot en producción)"],
)


@router.post(
    "/upload",
    response_model=FinancialSummaryResponse,
    summary="[DEV] Sube un CSV de transacciones y devuelve indicadores financieros descriptivos (sin predicción)",
)
async def upload_transactions_csv(
    file: UploadFile = File(..., description="Archivo CSV con columnas: type,category,amount,transaction_date,description"),
    company_id: Optional[int] = Form(None, description="Opcional, solo para incluirlo en la respuesta"),
) -> FinancialSummaryResponse:
    # UploadFile.read() es async porque FastAPI maneja el archivo como
    # un stream; await asegura que se lea completo antes de continuar.
    file_bytes = await file.read()

    df = parse_csv_bytes(file_bytes)
    return build_financial_summary(df, company_id)
