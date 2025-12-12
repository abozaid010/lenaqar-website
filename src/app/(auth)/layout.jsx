import { SITE_URL } from "../metadata";

export const metadata = {
  title: "Login",
  description:
    "Login to LENAAI - AI-powered real estate CRM platform. Access your dashboard, manage properties, and automate your sales process.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
};

export default function AuthLayout({ children }) {
  return children;
}

