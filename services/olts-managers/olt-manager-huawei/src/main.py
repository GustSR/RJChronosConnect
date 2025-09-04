from fastapi import FastAPI

app = FastAPI(
    title="OLT Manager - Huawei",
    description="Serviço para gerenciar OLTs da Huawei.",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"message": "OLT Manager - Huawei is running"}
