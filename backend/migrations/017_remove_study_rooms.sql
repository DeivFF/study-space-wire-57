-- Migration: Remove Study Room Related Features
-- This migration removes all database objects related to study rooms

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_transfer_room_ownership_on_user_delete ON users;

-- Drop functions
DROP FUNCTION IF EXISTS public.transfer_room_ownership_on_user_delete();
DROP FUNCTION IF EXISTS public.increment_room_members_count();
DROP FUNCTION IF EXISTS public.decrement_room_members_count();

-- Drop tables that might exist (if they were created)
DROP TABLE IF EXISTS room_moderation_logs;
DROP TABLE IF EXISTS room_access_requests;  
DROP TABLE IF EXISTS room_invitations;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS rooms;

-- Drop ENUM types
DROP TYPE IF EXISTS public.room_visibility;
DROP TYPE IF EXISTS public.room_member_role;
DROP TYPE IF EXISTS public.moderation_action;
DROP TYPE IF EXISTS public.invitation_type;
DROP TYPE IF EXISTS public.invitation_status;
DROP TYPE IF EXISTS public.access_request_status;