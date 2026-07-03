from fastapi import FastAPI, Depends, HTTPException, Request as FastAPIRequest, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from auth import verify_token, supabase
from models import Profile, WeightLog, ProgressPhoto, MessageCreate
from typing import List, Optional
import uuid
import os

app = FastAPI()

frontend_urls = os.getenv("FRONTEND_URL", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── PROFILE ────────────────────────────────────────────────

@app.get("/api/profile")
def get_profile(user_id: str = Depends(verify_token)):
    res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(status_code=404, detail="Profile not found")

@app.post("/api/profile")
def create_profile(profile: dict, user_id: str = Depends(verify_token)):
    data = {
        "id": user_id,
        "role": profile.get("role", "client"),
        "full_name": profile.get("full_name", ""),
        "weight": profile.get("weight", 0),
        "target_weight": profile.get("target_weight", 0),
        "trainer_id": profile.get("trainer_id", None)
    }
    res = supabase.table("profiles").insert(data).execute()
    return res.data[0]

# ─── TRAINERS ───────────────────────────────────────────────

@app.get("/api/trainers")
def get_trainers():
    res = supabase.table("profiles").select("id, full_name").eq("role", "trainer").execute()
    return res.data

@app.get("/api/trainers/{trainer_id}")
def get_trainer(trainer_id: str):
    res = supabase.table("profiles").select("id, full_name").eq("id", trainer_id).execute()
    if res.data:
        return res.data[0]
    return {"id": trainer_id, "full_name": "Unknown Trainer"}

# ─── CLIENTS (trainer access) ────────────────────────────────

@app.get("/api/clients")
def get_clients(user_id: str = Depends(verify_token)):
    prof = supabase.table("profiles").select("role").eq("id", user_id).execute()
    if not prof.data or prof.data[0]["role"] != "trainer":
        raise HTTPException(403, "Not authorized")
    res = supabase.table("profiles").select("*").eq("trainer_id", user_id).execute()
    return res.data

@app.get("/api/clients/{client_id}/logs")
def get_client_logs(client_id: str, user_id: str = Depends(verify_token)):
    """Trainer reads a specific client's weight logs"""
    # Verify caller is this client's trainer
    prof = supabase.table("profiles").select("trainer_id").eq("id", client_id).execute()
    if not prof.data or prof.data[0].get("trainer_id") != user_id:
        raise HTTPException(403, "Not authorized to view this client's logs")
    res = supabase.table("weight_logs").select("*").eq("user_id", client_id).order("date", desc=True).execute()
    return res.data

@app.get("/api/clients/{client_id}/photos")
def get_client_photos(client_id: str, user_id: str = Depends(verify_token)):
    """Trainer reads a specific client's progress photos"""
    prof = supabase.table("profiles").select("trainer_id").eq("id", client_id).execute()
    if not prof.data or prof.data[0].get("trainer_id") != user_id:
        raise HTTPException(403, "Not authorized to view this client's photos")
    res = supabase.table("progress_photos").select("*").eq("user_id", client_id).order("date", desc=True).execute()
    return res.data

# ─── WEIGHT LOGS ────────────────────────────────────────────

@app.get("/api/logs")
def get_logs(user_id: str = Depends(verify_token)):
    res = supabase.table("weight_logs").select("*").eq("user_id", user_id).order("date", desc=True).execute()
    return res.data

@app.post("/api/logs")
def add_log(log: WeightLog, user_id: str = Depends(verify_token)):
    data = log.model_dump()
    data["user_id"] = user_id
    data["date"] = data["date"].isoformat()
    res = supabase.table("weight_logs").insert(data).execute()
    return res.data[0]

# ─── PHOTOS ─────────────────────────────────────────────────

@app.get("/api/photos")
def get_photos(user_id: str = Depends(verify_token)):
    res = supabase.table("progress_photos").select("*").eq("user_id", user_id).order("date", desc=True).execute()
    return res.data

@app.post("/api/photos")
def add_photo(photo: ProgressPhoto, user_id: str = Depends(verify_token)):
    data = photo.model_dump()
    data["user_id"] = user_id
    data["date"] = data["date"].isoformat()
    res = supabase.table("progress_photos").insert(data).execute()
    return res.data[0]

@app.post("/api/photos/upload")
async def upload_photo_file(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):
    """Upload photo to Supabase Storage using service role key (bypasses RLS)"""
    try:
        contents = await file.read()
        ext = (file.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
        allowed = {"jpg", "jpeg", "png", "gif", "webp"}
        if ext not in allowed:
            raise HTTPException(400, f"File type .{ext} not allowed")
        file_path = f"photos/{user_id}/{uuid.uuid4()}.{ext}"
        supabase.storage.from_("progress-photos").upload(
            file_path, contents,
            {"content-type": file.content_type or f"image/{ext}", "x-upsert": "true"}
        )
        url = supabase.storage.from_("progress-photos").get_public_url(file_path)
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

# ─── MESSAGES ───────────────────────────────────────────────

@app.get("/api/messages/{other_user_id}")
def get_messages(other_user_id: str, user_id: str = Depends(verify_token)):
    """Get conversation between current user and other_user_id"""
    res = supabase.table("messages").select("*").or_(
        f"and(sender_id.eq.{user_id},receiver_id.eq.{other_user_id}),"
        f"and(sender_id.eq.{other_user_id},receiver_id.eq.{user_id})"
    ).order("created_at", desc=False).execute()
    return res.data

@app.post("/api/messages")
def send_message(msg: MessageCreate, user_id: str = Depends(verify_token)):
    """Send a message from current user to receiver"""
    data = {
        "sender_id": user_id,
        "receiver_id": msg.receiver_id,
        "text": msg.text,
    }
    res = supabase.table("messages").insert(data).execute()
    return res.data[0]

# ─── DIET PLANS ─────────────────────────────────────────────

@app.get("/api/diet")
def get_diet_plan(user_id: str = Depends(verify_token)):
    """Client gets their own diet plan"""
    res = supabase.table("diet_plans").select("*").eq("client_id", user_id).order("created_at", desc=True).limit(1).execute()
    return res.data

@app.get("/api/diet/{client_id}")
def get_diet_plan_for_client(client_id: str, user_id: str = Depends(verify_token)):
    """Trainer gets a specific client's diet plan"""
    prof = supabase.table("profiles").select("trainer_id").eq("id", client_id).execute()
    if not prof.data or prof.data[0].get("trainer_id") != user_id:
        raise HTTPException(403, "Not authorized")
    res = supabase.table("diet_plans").select("*").eq("client_id", client_id).order("created_at", desc=True).limit(1).execute()
    return res.data

@app.post("/api/diet/upload")
async def upload_diet_plan(
    client_id: str = Form(...),
    notes: Optional[str] = Form(""),
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):
    """Trainer uploads a PDF diet plan for a specific client"""
    # Verify this trainer owns the client
    prof = supabase.table("profiles").select("trainer_id").eq("id", client_id).execute()
    if not prof.data or prof.data[0].get("trainer_id") != user_id:
        raise HTTPException(403, "Not authorized to assign diet plan to this client")

    try:
        contents = await file.read()
        ext = (file.filename or "diet.pdf").rsplit(".", 1)[-1].lower()
        if ext != "pdf":
            raise HTTPException(400, "Only PDF files are allowed for diet plans")
        file_path = f"diet-plans/{client_id}/{uuid.uuid4()}.pdf"
        supabase.storage.from_("diet-pdfs").upload(
            file_path, contents,
            {"content-type": "application/pdf", "x-upsert": "true"}
        )
        pdf_url = supabase.storage.from_("diet-pdfs").get_public_url(file_path)

        # Upsert diet plan record
        existing = supabase.table("diet_plans").select("id").eq("client_id", client_id).execute()
        plan_data = {
            "client_id": client_id,
            "trainer_id": user_id,
            "pdf_url": pdf_url,
            "notes": notes or "",
            "meals": [],
            "assigned": True,
        }
        if existing.data:
            res = supabase.table("diet_plans").update(plan_data).eq("client_id", client_id).execute()
        else:
            res = supabase.table("diet_plans").insert(plan_data).execute()
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Diet plan upload failed: {str(e)}")
