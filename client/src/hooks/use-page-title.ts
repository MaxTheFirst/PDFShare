import { useEffect } from "react";

const APP_TITLE = "PDFShare";

export function getPageTitle(title?: string | null) {
  return title || APP_TITLE;
}

export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = getPageTitle(title);
  }, [title]);
}
