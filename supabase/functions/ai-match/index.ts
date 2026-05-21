import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the calling user from their JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the current user's profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!myProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the user's partner preferences
    const { data: prefs } = await supabase
      .from("partner_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Fetch candidate profiles (exclude self)
    const { data: candidates } = await supabase
      .from("profiles")
      .select("*")
      .neq("user_id", user.id)
      .eq("profile_complete", true)
      .limit(50);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: cachedMatches } = await supabase
      .from("daily_matches")
      .select("*")
      .eq("user_id", user.id)
      .eq("match_date", today);

    if (cachedMatches && cachedMatches.length > 0) {
      const matches = cachedMatches.map((row) => ({
        profile_id: row.match_user_id,
        score: row.compatibility_score,
        insights: Array.isArray(row.match_reasons) ? row.match_reasons : [],
      }));

      return new Response(JSON.stringify({ matches }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI
    const myProfileSummary = JSON.stringify({
      age: myProfile.date_of_birth
        ? Math.floor((Date.now() - new Date(myProfile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null,
      gender: myProfile.gender,
      religion: myProfile.religion,
      community: myProfile.community,
      caste: myProfile.caste,
      education: myProfile.education,
      profession: myProfile.profession,
      location: myProfile.location,
      state: myProfile.state,
      height: myProfile.height,
      marital_status: myProfile.marital_status,
      rashi: myProfile.rashi,
      nakshatra: myProfile.nakshatra,
      manglik: myProfile.manglik,
      family_values: myProfile.family_values,
      income: myProfile.income,
    });

    const prefsSummary = prefs
      ? JSON.stringify({
          min_age: prefs.min_age,
          max_age: prefs.max_age,
          preferred_religion: prefs.preferred_religion,
          preferred_communities: prefs.preferred_communities,
          preferred_education: prefs.preferred_education,
          preferred_locations: prefs.preferred_locations,
          preferred_marital_status: prefs.preferred_marital_status,
        })
      : "No specific preferences set";

    const candidateSummaries = candidates.map((c) => ({
      id: c.id,
      age: c.date_of_birth
        ? Math.floor((Date.now() - new Date(c.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null,
      gender: c.gender,
      religion: c.religion,
      community: c.community,
      caste: c.caste,
      education: c.education,
      profession: c.profession,
      location: c.location,
      state: c.state,
      height: c.height,
      marital_status: c.marital_status,
      rashi: c.rashi,
      nakshatra: c.nakshatra,
      manglik: c.manglik,
      family_values: c.family_values,
      income: c.income,
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a matrimonial compatibility scoring engine for an Indian matchmaking platform. 
Given a user's profile, their partner preferences, and a list of candidate profiles, calculate a compatibility score (0-100) for each candidate.

Scoring factors (weighted):
- Partner preference alignment (30%): Does the candidate match stated preferences for age, religion, community, education, location?
- Demographic compatibility (20%): Age gap, location proximity (same state = higher), marital status compatibility
- Socio-cultural match (20%): Religion, community, caste alignment, family values
- Professional compatibility (15%): Education level parity, income bracket compatibility
- Horoscope compatibility (15%): Rashi/nakshatra compatibility, manglik status (if both manglik or both non-manglik = compatible)

Also provide exactly 3 short compatibility insights per candidate explaining WHY they match.

Return ONLY valid JSON, no markdown.`;

    const userPrompt = `My profile: ${myProfileSummary}

My partner preferences: ${prefsSummary}

Candidates: ${JSON.stringify(candidateSummaries)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_matches",
              description: "Return compatibility scores and insights for each candidate",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        profile_id: { type: "string", description: "The candidate profile ID" },
                        score: { type: "number", description: "Compatibility score 0-100" },
                        insights: {
                          type: "array",
                          items: { type: "string" },
                          description: "Exactly 3 short reasons why they match",
                        },
                      },
                      required: ["profile_id", "score", "insights"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_matches" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI matching failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let matches: any[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      matches = parsed.matches || [];
    }

    // Update match_score in DB for each matched profile
    for (const match of matches) {
      await supabase
        .from("profiles")
        .update({ match_score: Math.round(match.score) })
        .eq("id", match.profile_id);
    }

    // Cache daily matches for the current user
    await supabase
      .from("daily_matches")
      .delete()
      .eq("user_id", user.id)
      .eq("match_date", today);

    if (matches.length > 0) {
      await supabase.from("daily_matches").insert(
        matches.map((match) => ({
          user_id: user.id,
          match_user_id: match.profile_id,
          compatibility_score: Math.round(match.score),
          match_date: today,
          match_reasons: match.insights || [],
        }))
      );
    }

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
