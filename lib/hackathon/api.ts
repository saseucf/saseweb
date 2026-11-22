import type { SupabaseClient } from "@supabase/supabase-js";

export type ApplicationInput = {
  first_name: string;
  last_name: string;
  age: number;
  phone: string;
  school_id: string;
  level_of_study: string;
  country_code: string;
  shirt_size?: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "other";
  dietary_restrictions?: string;
};

async function unwrap<T>(request: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const result = await request;
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** Pass a user-scoped client; database RLS applies to every query and RPC. */
export function hackathonApi(client: SupabaseClient) {
  return {
    async landing(slug: string) {
      const event = await unwrap(client.from("hackathons").select("*").eq("slug", slug).single());
      const [tracks, sponsors, faqs] = await Promise.all([
        unwrap(client.from("tracks").select("*").eq("hackathon_id", event.id)),
        unwrap(client.from("sponsors").select("*").eq("hackathon_id", event.id).order("display_order")),
        unwrap(client.from("faqs").select("*").eq("hackathon_id", event.id).order("display_order")),
      ]);
      return { event, tracks, sponsors, faqs };
    },
    async dashboard(hackathonId: string) {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) throw new Error("Sign in first.");
      const [event, application, schedule, floors, locations, resources, perks, team, teammates, announcements] = await Promise.all([
        unwrap(client.from("hackathons").select("*").eq("id", hackathonId).single()),
        unwrap(client.from("applications").select("*").eq("hackathon_id", hackathonId).eq("user_id", data.user.id).maybeSingle()),
        unwrap(client.from("schedule_events").select("*").eq("hackathon_id", hackathonId).order("starts_at")),
        unwrap(client.from("map_floors").select("*").eq("hackathon_id", hackathonId)),
        unwrap(client.from("locations").select("*").eq("hackathon_id", hackathonId)),
        unwrap(client.from("hacker_resources").select("*").eq("hackathon_id", hackathonId).maybeSingle()),
        unwrap(client.from("perks").select("*").eq("hackathon_id", hackathonId)),
        unwrap(client.from("team_members").select("team_id, teams(*)").eq("hackathon_id", hackathonId).eq("user_id", data.user.id).maybeSingle()),
        unwrap(client.rpc("get_teammates", { p_hackathon_id: hackathonId })),
        unwrap(client.from("announcements").select("*").eq("hackathon_id", hackathonId).order("created_at", { ascending: false })),
      ]);
      return { event, application, schedule, floors, locations, resources, perks, team, teammates, announcements };
    },
    submitApplication(hackathonId: string, input: ApplicationInput, termsVersion: string,
      consent: { codeOfConduct: boolean; dataSharing: boolean; marketing: boolean }) {
      return unwrap(client.rpc("submit_application", {
        p_hackathon_id: hackathonId, p_data: input, p_terms_version: termsVersion,
        p_code_of_conduct: consent.codeOfConduct, p_data_sharing: consent.dataSharing, p_marketing: consent.marketing,
      }));
    },
    updateProfile(hackathonId: string, input: Partial<Pick<ApplicationInput, "first_name" | "last_name" | "phone" | "shirt_size" | "dietary_restrictions">> & { resume_path?: string | null }) {
      return unwrap(client.rpc("update_hacker_profile", { p_hackathon_id: hackathonId, p_data: input }));
    },
    setStatus(applicationId: string, status: "accepted" | "waitlisted" | "rejected" | "confirmed" | "withdrawn") {
      return unwrap(client.rpc("set_application_status", { p_application_id: applicationId, p_status: status }));
    },
    createTeam(hackathonId: string, name: string, trackId: string | null = null) {
      return unwrap(client.rpc("create_team", { p_hackathon_id: hackathonId, p_name: name, p_track_id: trackId }));
    },
    joinTeam(hackathonId: string, inviteCode: string) {
      return unwrap(client.rpc("join_team", { p_hackathon_id: hackathonId, p_invite_code: inviteCode }));
    },
    leaveTeam(hackathonId: string) {
      return unwrap(client.rpc("leave_team", { p_hackathon_id: hackathonId }));
    },
    scan(hackathonId: string, qrToken: string, eventId: string | null = null) {
      return unwrap(client.rpc("scan_hacker", { p_hackathon_id: hackathonId, p_qr_token: qrToken, p_event_id: eventId }));
    },
    async uploadResume(hackathonId: string, file: File) {
      if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024) throw new Error("Upload a PDF up to 5 MB.");
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) throw new Error("Sign in first.");
      const path = `${hackathonId}/${data.user.id}/${crypto.randomUUID()}.pdf`;
      await unwrap(client.storage.from("hacker-resumes").upload(path, file, { contentType: "application/pdf", upsert: false }));
      try {
        await unwrap(client.rpc("update_hacker_profile", { p_hackathon_id: hackathonId, p_data: { resume_path: path } }));
      } catch (error) {
        await client.storage.from("hacker-resumes").remove([path]);
        throw error;
      }
      return path;
    },
    resumeDownload(path: string) {
      return unwrap(client.storage.from("hacker-resumes").createSignedUrl(path, 60));
    },
  };
}
