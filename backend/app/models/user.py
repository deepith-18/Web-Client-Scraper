from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, JSON
from datetime import datetime
from backend.app.core.database import Base
from backend.app.models import generate_uuid

def default_permissions(role: str = "caller") -> dict:
    if role == "admin":
        return {
            "can_discover": True,
            "can_call": True,
            "can_view_leads": True,
            "can_edit_leads": True,
            "can_delete_leads": True,
            "can_export_data": True,
            "can_view_audits": True,
            "can_manage_templates": True,
            "can_manage_team": True,
            "can_view_analytics": True
        }
    elif role in ["caller", "sdr"]:
        return {
            "can_discover": False,
            "can_call": True,
            "can_view_leads": True,
            "can_edit_leads": True,
            "can_delete_leads": False,
            "can_export_data": False,
            "can_view_audits": False,
            "can_manage_templates": False,
            "can_manage_team": False,
            "can_view_analytics": False
        }
    elif role == "developer":
        return {
            "can_discover": True,
            "can_call": False,
            "can_view_leads": True,
            "can_edit_leads": True,
            "can_delete_leads": False,
            "can_export_data": True,
            "can_view_audits": True,
            "can_manage_templates": True,
            "can_manage_team": False,
            "can_view_analytics": True
        }
    return {
        "can_discover": False,
        "can_call": True,
        "can_view_leads": True,
        "can_edit_leads": False,
        "can_delete_leads": False,
        "can_export_data": False,
        "can_view_audits": False,
        "can_manage_templates": False,
        "can_manage_team": False,
        "can_view_analytics": False
    }

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="developer", nullable=False)  # admin, caller, sdr, developer
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(50), nullable=True)
    daily_call_target = Column(Integer, default=30, nullable=False)
    notes = Column(Text, nullable=True)
    permissions = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


