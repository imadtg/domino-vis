import posthog from "posthog-js";
if(typeof process.env.NEXT_PUBLIC_POSTHOG_KEY == 'undefined'){
  throw new Error('Posthog key env variable is not set!')
}
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: "/relay-oLEZ", // TODO: move to .env or interpolate from NEXT_PUBLIC_POSTHOG_HOST ?
  ui_host: 'https://eu.posthog.com' 
  defaults: "2025-05-24",
});