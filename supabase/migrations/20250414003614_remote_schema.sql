

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email) -- Fallback to email if name not provided
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."projects_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."projects_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."projects_id_seq" OWNED BY "public"."projects"."id";



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "order" integer DEFAULT 0,
    "description" "text",
    "estimated_time" integer DEFAULT 0,
    "notes" "text",
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."tasks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."tasks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tasks_id_seq" OWNED BY "public"."tasks"."id";



CREATE TABLE IF NOT EXISTS "public"."tasks_projects" (
    "task_id" integer NOT NULL,
    "project_id" integer NOT NULL
);


ALTER TABLE "public"."tasks_projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."projects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."projects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tasks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks_projects"
    ADD CONSTRAINT "tasks_projects_pkey" PRIMARY KEY ("task_id", "project_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "tasks_user_id_idx" ON "public"."tasks" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."tasks_projects"
    ADD CONSTRAINT "tasks_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks_projects"
    ADD CONSTRAINT "tasks_projects_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_delete_all" ON "public"."projects" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "projects_insert_all" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "projects_select_all" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "projects_update_all" ON "public"."projects" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete_own" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "tasks_insert_own" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."tasks_projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_projects_delete_own" ON "public"."tasks_projects" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "tasks_projects"."task_id") AND ("tasks"."user_id" = "auth"."uid"())))));



CREATE POLICY "tasks_projects_insert_own" ON "public"."tasks_projects" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "tasks_projects"."task_id") AND ("tasks"."user_id" = "auth"."uid"())))));



CREATE POLICY "tasks_projects_select_own" ON "public"."tasks_projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."id" = "tasks_projects"."task_id") AND ("tasks"."user_id" = "auth"."uid"())))));



CREATE POLICY "tasks_select_own" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "tasks_update_own" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "user_update_own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tasks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tasks_projects" TO "anon";
GRANT ALL ON TABLE "public"."tasks_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks_projects" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
