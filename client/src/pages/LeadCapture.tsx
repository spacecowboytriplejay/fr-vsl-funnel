/**
 * LeadCapture.tsx
 *
 * TASK 4   This page has been decommissioned.
 * The prohibited return figure stat and minimum capital figures
 * have been removed per compliance requirements.
 *
 * Traffic now goes directly to the VSL page. This component exists only
 * as a redirect stub so any residual links resolve cleanly.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LeadCapture() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/vsl", { replace: true });
  }, [navigate]);

  return null;
}
