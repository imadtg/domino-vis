import posthog from "posthog-js";
if(typeof process.env.NEXT_PUBLIC_POSTHOG_KEY == 'undefined'){
  throw new Error('Posthog key env variable is not set!')
}
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24",
});