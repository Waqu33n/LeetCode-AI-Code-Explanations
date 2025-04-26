from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import ollama
import traceback
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://leetcode.com"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

model = "local/tinyllama"
system_prompt = (
    "You are an expert coder -- please identify the computer science concepts "
    "and explain the logic in this code block in less than 500 words. Please be as " \
    "concise as possible in your response and do not explain the function definition."
)
code = ""

def load_model():
    print("Loading model")
    try:
        ollama.generate(model=model, prompt="Hello", stream=False)
        print("Model warmed up.")
    except Exception as e:
        print("Model warmup failed:", e)

@app.get("/")
def root():
    return {"status": "OK"}

@app.post("/explain")
async def explain_code(request: Request):
    try:
        body = await request.json()
        code = body.get("code", "")

        full_prompt = f"### Instruction:\n{system_prompt}\n\n{code}\n\n### Response:\n"

        def token_stream():
            try:
                for chunk in ollama.generate(model=model, prompt=full_prompt, stream=True):
                    yield chunk["response"]
            except Exception as e:
                yield f"\n[Streaming Error] {str(e)}"

        return StreamingResponse(token_stream(), media_type="text/plain")

    except Exception as e:
        print("Error during inference:", str(e))
        traceback.print_exc()
        return {"error": "Internal Server Error", "message": str(e)}

@app.post("/followup")
async def follow_up(request: Request):
    try:
        body = await request.json()
        question = body.get("question", "")
        question = "Please be as concise as possible in your response. " + question

        full_prompt = f"### Instruction:\n{question}\n\n{code}\n\n### Response:\n"

        def token_stream():
            try:
                for chunk in ollama.generate(model=model, prompt=full_prompt, stream=True):
                    yield chunk["response"]
            except Exception as e:
                yield f"\n[Streaming Error] {str(e)}"

        return StreamingResponse(token_stream(), media_type="text/plain")

    except Exception as e:
        print("Error during inference:", str(e))
        traceback.print_exc()
        return {"error": "Internal Server Error", "message": str(e)}

if __name__ == "__main__":
    load_model()
    uvicorn.run("fast_app:app", host="0.0.0.0", port=5000, reload=True)
