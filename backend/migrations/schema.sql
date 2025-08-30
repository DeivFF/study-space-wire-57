--
-- PostgreSQL database dump
--

\restrict 48HBNHpwZbvXvLYKnxh9P9FvHjumZbUlua00V7gMOYzs44GfhAY34MOT7WAJEd6

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: access_request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.access_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.access_request_status OWNER TO postgres;

--
-- Name: invitation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invitation_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'expired'
);


ALTER TYPE public.invitation_status OWNER TO postgres;

--
-- Name: invitation_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invitation_type AS ENUM (
    'direct',
    'link',
    'access_request'
);


ALTER TYPE public.invitation_type OWNER TO postgres;

--
-- Name: moderation_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.moderation_action AS ENUM (
    'member_invited',
    'member_joined',
    'member_left',
    'member_kicked',
    'member_promoted',
    'member_demoted',
    'member_silenced',
    'member_unsilenced',
    'room_settings_changed',
    'ownership_transferred',
    'invite_link_created',
    'invite_link_used',
    'access_request_approved',
    'access_request_rejected'
);


ALTER TYPE public.moderation_action OWNER TO postgres;

--
-- Name: room_member_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.room_member_role AS ENUM (
    'owner',
    'moderator',
    'member'
);


ALTER TYPE public.room_member_role OWNER TO postgres;

--
-- Name: room_visibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.room_visibility AS ENUM (
    'public',
    'private'
);


ALTER TYPE public.room_visibility OWNER TO postgres;

--
-- Name: decrement_room_members_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.decrement_room_members_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE rooms SET current_members = GREATEST(0, current_members - 1) WHERE id = OLD.room_id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION public.decrement_room_members_count() OWNER TO postgres;

--
-- Name: increment_room_members_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_room_members_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE rooms SET current_members = current_members + 1 WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.increment_room_members_count() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: transfer_room_ownership_on_user_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.transfer_room_ownership_on_user_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r RECORD;
  candidate UUID;
BEGIN
  -- For each room owned by the user being deleted
  FOR r IN SELECT id FROM rooms WHERE owner_id = OLD.id LOOP
    -- Pick oldest moderator
    SELECT user_id INTO candidate
    FROM room_members
    WHERE room_id = r.id AND role = 'moderator'
    ORDER BY joined_at ASC
    LIMIT 1;

    IF candidate IS NULL THEN
      -- Fallback to oldest member
      SELECT user_id INTO candidate
      FROM room_members
      WHERE room_id = r.id AND role = 'member'
      ORDER BY joined_at ASC
      LIMIT 1;
    END IF;

    IF candidate IS NULL THEN
      -- No candidates: deactivate room
      UPDATE rooms SET is_active = FALSE WHERE id = r.id;
    ELSE
      -- Transfer ownership
      UPDATE rooms SET owner_id = candidate WHERE id = r.id;
      -- Promote candidate to owner
      UPDATE room_members SET role = 'owner' WHERE room_id = r.id AND user_id = candidate;
      -- Demote any other owners just in case (unique index also enforces this)
      UPDATE room_members SET role = 'member' WHERE room_id = r.id AND user_id <> candidate AND role = 'owner';
    END IF;
  END LOOP;

  RETURN OLD;
END;
$$;


ALTER FUNCTION public.transfer_room_ownership_on_user_delete() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid,
    user_id uuid,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_read_at timestamp with time zone,
    is_muted boolean DEFAULT false
);


ALTER TABLE public.conversation_participants OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_message_at timestamp with time zone,
    is_archived boolean DEFAULT false
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    token character(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_verification_tokens OWNER TO postgres;

--
-- Name: TABLE email_verification_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.email_verification_tokens IS 'Manages email verification codes';


--
-- Name: exercise_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercise_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    selected_option_index integer,
    written_response text,
    is_correct boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.exercise_responses OWNER TO postgres;

--
-- Name: TABLE exercise_responses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.exercise_responses IS 'Stores user responses to exercises';


--
-- Name: COLUMN exercise_responses.post_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercise_responses.post_id IS 'Reference to the exercise post';


--
-- Name: COLUMN exercise_responses.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercise_responses.user_id IS 'Reference to the user who responded';


--
-- Name: COLUMN exercise_responses.selected_option_index; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercise_responses.selected_option_index IS 'Selected option for multiple choice exercises';


--
-- Name: COLUMN exercise_responses.written_response; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercise_responses.written_response IS 'Written response for descriptive exercises';


--
-- Name: COLUMN exercise_responses.is_correct; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercise_responses.is_correct IS 'Correctness flag (NULL for descriptive exercises)';


--
-- Name: COLUMN exercise_responses.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exercise_responses.created_at IS 'Timestamp when the response was submitted';


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier character varying(255) NOT NULL,
    ip_address character varying(45),
    success boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- Name: TABLE login_attempts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.login_attempts IS 'Tracks login attempts for security';


--
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid,
    user_id uuid,
    reaction character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_reactions OWNER TO postgres;

--
-- Name: message_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_reads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid,
    user_id uuid,
    read_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_reads OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid,
    sender_id uuid,
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    file_url character varying(500),
    file_name character varying(255),
    file_size integer,
    reply_to_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'file'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(50) NOT NULL,
    sender_id uuid,
    related_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: oauth_connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oauth_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    provider character varying(20) NOT NULL,
    provider_id character varying(255) NOT NULL,
    access_token character varying(500),
    refresh_token character varying(500),
    expires_at timestamp with time zone,
    profile_data jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.oauth_connections OWNER TO postgres;

--
-- Name: TABLE oauth_connections; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.oauth_connections IS 'Stores OAuth provider connections';


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    token character varying(100) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: TABLE password_reset_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.password_reset_tokens IS 'Manages password reset tokens';


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    option_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.poll_votes OWNER TO postgres;

--
-- Name: TABLE poll_votes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.poll_votes IS 'Stores individual votes for poll options';


--
-- Name: COLUMN poll_votes.post_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.poll_votes.post_id IS 'Reference to the poll post';


--
-- Name: COLUMN poll_votes.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.poll_votes.user_id IS 'Reference to the user who voted';


--
-- Name: COLUMN poll_votes.option_index; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.poll_votes.option_index IS 'Index of the selected option in poll_options array';


--
-- Name: COLUMN poll_votes.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.poll_votes.created_at IS 'Timestamp when the vote was cast';


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title character varying(255),
    content text NOT NULL,
    category character varying(100),
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(20) DEFAULT 'publicacao'::character varying NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT ARRAY[]::text[],
    is_anonymous boolean DEFAULT false,
    CONSTRAINT posts_type_check CHECK (((type)::text = ANY ((ARRAY['publicacao'::character varying, 'duvida'::character varying, 'exercicio'::character varying, 'desafio'::character varying, 'enquete'::character varying])::text[])))
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: COLUMN posts.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.posts.type IS 'Type of post: publicacao, duvida, exercicio, or desafio';


--
-- Name: COLUMN posts.data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.posts.data IS 'JSONB data specific to post type (e.g., difficulty level, exercise type, etc.)';


--
-- Name: COLUMN posts.tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.posts.tags IS 'Array of tags for categorization and search';


--
-- Name: COLUMN posts.is_anonymous; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.posts.is_anonymous IS 'Whether the post should be displayed anonymously';


--
-- Name: CONSTRAINT posts_type_check ON posts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT posts_type_check ON public.posts IS 'Valid post types: publicacao, duvida, exercicio, desafio, enquete';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    nickname character varying(50),
    first_name character varying(100),
    last_name character varying(100),
    avatar_url character varying(500),
    status character varying(20) DEFAULT 'offline'::character varying,
    last_activity timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bio text,
    city character varying(100),
    interests text,
    contact_email character varying(255),
    contact_visible_to_friends boolean DEFAULT false,
    private_profile boolean DEFAULT false,
    deactivated boolean DEFAULT false,
    deleted boolean DEFAULT false
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.profiles IS 'Stores user profile information';


--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(20) NOT NULL,
    subcategory character varying(100),
    title text NOT NULL,
    content text NOT NULL,
    type character varying(20) NOT NULL,
    year integer NOT NULL,
    difficulty character varying(20),
    subject_area character varying(100),
    legal_branch character varying(100),
    exam_phase character varying(20),
    institution character varying(100),
    "position" character varying(100),
    education_level character varying(20),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: user_question_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_question_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    question_id uuid,
    is_correct boolean NOT NULL,
    answered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    time_spent_seconds integer
);


ALTER TABLE public.user_question_stats OWNER TO postgres;

--
-- Name: question_error_rates; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.question_error_rates AS
 SELECT q.id,
    q.title,
    count(uqs.id) AS total_responses,
    count(
        CASE
            WHEN (uqs.is_correct = false) THEN 1
            ELSE NULL::integer
        END) AS incorrect_responses,
        CASE
            WHEN (count(uqs.id) > 0) THEN (((count(
            CASE
                WHEN (uqs.is_correct = false) THEN 1
                ELSE NULL::integer
            END))::numeric * 100.0) / (count(uqs.id))::numeric)
            ELSE (0)::numeric
        END AS error_rate_percentage
   FROM (public.questions q
     LEFT JOIN public.user_question_stats uqs ON ((q.id = uqs.question_id)))
  GROUP BY q.id, q.title;


ALTER VIEW public.question_error_rates OWNER TO postgres;

--
-- Name: question_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid,
    option_letter character(1) NOT NULL,
    content text NOT NULL,
    is_correct boolean DEFAULT false,
    explanation text
);


ALTER TABLE public.question_options OWNER TO postgres;

--
-- Name: user_connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requester_id uuid,
    receiver_id uuid,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_connections OWNER TO postgres;

--
-- Name: user_favorite_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorite_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    question_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_favorite_questions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    is_active boolean DEFAULT true,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    name character varying(255),
    onboarding_completed boolean DEFAULT false,
    CONSTRAINT valid_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Stores user authentication information';


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: exercise_responses exercise_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_responses
    ADD CONSTRAINT exercise_responses_pkey PRIMARY KEY (id);


--
-- Name: exercise_responses exercise_responses_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_responses
    ADD CONSTRAINT exercise_responses_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: message_reactions message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);


--
-- Name: message_reads message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_connections oauth_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_connections
    ADD CONSTRAINT oauth_connections_pkey PRIMARY KEY (id);


--
-- Name: oauth_connections oauth_connections_provider_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_connections
    ADD CONSTRAINT oauth_connections_provider_provider_id_key UNIQUE (provider, provider_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_nickname_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_nickname_key UNIQUE (nickname);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: question_options question_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants unique_conversation_participant; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id);


--
-- Name: message_reactions unique_message_user_reaction; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT unique_message_user_reaction UNIQUE (message_id, user_id, reaction);


--
-- Name: message_reads unique_message_user_read; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT unique_message_user_read UNIQUE (message_id, user_id);


--
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_questions user_favorite_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_questions
    ADD CONSTRAINT user_favorite_questions_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_questions user_favorite_questions_user_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_questions
    ADD CONSTRAINT user_favorite_questions_user_id_question_id_key UNIQUE (user_id, question_id);


--
-- Name: user_question_stats user_question_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_stats
    ADD CONSTRAINT user_question_stats_pkey PRIMARY KEY (id);


--
-- Name: user_question_stats user_question_stats_user_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_stats
    ADD CONSTRAINT user_question_stats_user_id_question_id_key UNIQUE (user_id, question_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_connections_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_connections_receiver ON public.user_connections USING btree (receiver_id);


--
-- Name: idx_connections_requester; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_connections_requester ON public.user_connections USING btree (requester_id);


--
-- Name: idx_connections_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_connections_status ON public.user_connections USING btree (status);


--
-- Name: idx_conversation_participants_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants USING btree (conversation_id);


--
-- Name: idx_conversation_participants_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants USING btree (user_id);


--
-- Name: idx_conversations_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_updated_at ON public.conversations USING btree (updated_at DESC);


--
-- Name: idx_email_verification_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verification_expires ON public.email_verification_tokens USING btree (expires_at);


--
-- Name: idx_email_verification_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verification_token ON public.email_verification_tokens USING btree (token);


--
-- Name: idx_email_verification_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verification_user_id ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_exercise_responses_correct; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exercise_responses_correct ON public.exercise_responses USING btree (is_correct);


--
-- Name: idx_exercise_responses_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exercise_responses_post_id ON public.exercise_responses USING btree (post_id);


--
-- Name: idx_exercise_responses_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exercise_responses_user_id ON public.exercise_responses USING btree (user_id);


--
-- Name: idx_favorites_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_user_created ON public.user_favorite_questions USING btree (user_id, created_at);


--
-- Name: idx_login_attempts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_attempts_created_at ON public.login_attempts USING btree (created_at);


--
-- Name: idx_login_attempts_identifier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_attempts_identifier ON public.login_attempts USING btree (identifier);


--
-- Name: idx_login_attempts_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_attempts_ip ON public.login_attempts USING btree (ip_address);


--
-- Name: idx_message_reactions_message_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_message_reactions_message_id ON public.message_reactions USING btree (message_id);


--
-- Name: idx_message_reads_message_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_message_reads_message_id ON public.message_reads USING btree (message_id);


--
-- Name: idx_message_reads_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_message_reads_user_id ON public.message_reads USING btree (user_id);


--
-- Name: idx_messages_conversation_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_reply_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_reply_to ON public.messages USING btree (reply_to_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_migrations_applied_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migrations_applied_at ON public.migrations USING btree (applied_at);


--
-- Name: idx_migrations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migrations_name ON public.migrations USING btree (name);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_sender_id ON public.notifications USING btree (sender_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_oauth_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_provider ON public.oauth_connections USING btree (provider);


--
-- Name: idx_oauth_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oauth_user_id ON public.oauth_connections USING btree (user_id);


--
-- Name: idx_password_reset_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_poll_votes_option; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_poll_votes_option ON public.poll_votes USING btree (post_id, option_index);


--
-- Name: idx_poll_votes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_poll_votes_post_id ON public.poll_votes USING btree (post_id);


--
-- Name: idx_poll_votes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_poll_votes_user_id ON public.poll_votes USING btree (user_id);


--
-- Name: idx_post_comments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_created_at ON public.post_comments USING btree (created_at);


--
-- Name: idx_post_comments_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_post_id ON public.post_comments USING btree (post_id);


--
-- Name: idx_post_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_user_id ON public.post_comments USING btree (user_id);


--
-- Name: idx_post_likes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);


--
-- Name: idx_post_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);


--
-- Name: idx_posts_anonymous; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_anonymous ON public.posts USING btree (is_anonymous, created_at DESC) WHERE (is_anonymous = true);


--
-- Name: idx_posts_categoria_materia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_categoria_materia ON public.posts USING btree (((data ->> 'categoria_materia'::text))) WHERE (data ? 'categoria_materia'::text);


--
-- Name: idx_posts_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_category ON public.posts USING btree (category);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- Name: idx_posts_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_data ON public.posts USING gin (data);


--
-- Name: idx_posts_enquete_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_enquete_active ON public.posts USING btree (created_at DESC) WHERE (((type)::text = 'enquete'::text) AND (((data ->> 'poll_duration'::text))::integer > 0));


--
-- Name: idx_posts_enquete_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_enquete_data ON public.posts USING btree (((data ->> 'poll_duration'::text))) WHERE ((type)::text = 'enquete'::text);


--
-- Name: idx_posts_nivel_dificuldade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_nivel_dificuldade ON public.posts USING btree (((data ->> 'nivel_dificuldade'::text))) WHERE (data ? 'nivel_dificuldade'::text);


--
-- Name: idx_posts_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_tags ON public.posts USING gin (tags);


--
-- Name: idx_posts_tipo_exercicio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_tipo_exercicio ON public.posts USING btree (((data ->> 'tipo_exercicio'::text))) WHERE (data ? 'tipo_exercicio'::text);


--
-- Name: idx_posts_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_type ON public.posts USING btree (type);


--
-- Name: idx_posts_type_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_type_created_at ON public.posts USING btree (type, created_at DESC);


--
-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);


--
-- Name: idx_posts_user_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_user_type ON public.posts USING btree (user_id, type);


--
-- Name: idx_profiles_nickname; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_nickname ON public.profiles USING btree (nickname);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_question_options_correct; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_options_correct ON public.question_options USING btree (question_id, is_correct);


--
-- Name: idx_question_options_question_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_question_options_question_id ON public.question_options USING btree (question_id);


--
-- Name: idx_questions_category_phase; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_category_phase ON public.questions USING btree (category, exam_phase) WHERE ((category)::text = 'OAB'::text);


--
-- Name: idx_questions_category_subcategory; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_category_subcategory ON public.questions USING btree (category, subcategory);


--
-- Name: idx_questions_category_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_category_year ON public.questions USING btree (category, year);


--
-- Name: idx_questions_difficulty_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_difficulty_subject ON public.questions USING btree (difficulty, subject_area);


--
-- Name: idx_questions_education_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_education_level ON public.questions USING btree (education_level);


--
-- Name: idx_questions_institution; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_institution ON public.questions USING btree (institution);


--
-- Name: idx_questions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_type ON public.questions USING btree (type);


--
-- Name: idx_user_stats_answered_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_stats_answered_at ON public.user_question_stats USING btree (answered_at);


--
-- Name: idx_user_stats_question; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_stats_question ON public.user_question_stats USING btree (question_id);


--
-- Name: idx_user_stats_user_correct; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_stats_user_correct ON public.user_question_stats USING btree (user_id, is_correct);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: unique_nickname_not_null; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_nickname_not_null ON public.profiles USING btree (nickname) WHERE ((nickname IS NOT NULL) AND ((nickname)::text <> ''::text));


--
-- Name: users trg_transfer_room_ownership_on_user_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_transfer_room_ownership_on_user_delete BEFORE DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.transfer_room_ownership_on_user_delete();


--
-- Name: oauth_connections update_oauth_connections_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_oauth_connections_updated_at BEFORE UPDATE ON public.oauth_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: exercise_responses exercise_responses_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_responses
    ADD CONSTRAINT exercise_responses_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: exercise_responses exercise_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercise_responses
    ADD CONSTRAINT exercise_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_reads message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_reads message_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_connections oauth_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_connections
    ADD CONSTRAINT oauth_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: question_options question_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_options
    ADD CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_connections user_connections_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_favorite_questions user_favorite_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_questions
    ADD CONSTRAINT user_favorite_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: user_favorite_questions user_favorite_questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite_questions
    ADD CONSTRAINT user_favorite_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_question_stats user_question_stats_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_stats
    ADD CONSTRAINT user_question_stats_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: user_question_stats user_question_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_stats
    ADD CONSTRAINT user_question_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 48HBNHpwZbvXvLYKnxh9P9FvHjumZbUlua00V7gMOYzs44GfhAY34MOT7WAJEd6

