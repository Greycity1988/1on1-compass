// Links shown in the footer. Forks can point them elsewhere with build-time environment variables.
export const FEEDBACK_ISSUES_URL: string =
  import.meta.env.VITE_FEEDBACK_ISSUES_URL || 'https://github.com/Greycity1988/1on1-compass/issues/new';
export const DONATION_URL: string = import.meta.env.VITE_DONATION_URL || 'https://ko-fi.com/greycity1988';
