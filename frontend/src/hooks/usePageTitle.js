import { useEffect } from 'react';

const SITE_NAME = 'AlumniLaunch';

/**
 * Sets document.title (and optionally the meta description) for the
 * current page. Public pages should call this with a specific title so
 * each route is distinguishable in Google search results, browser tabs,
 * and social shares — instead of every page showing the same generic title.
 */
export default function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      const previous = tag.getAttribute('content');
      tag.setAttribute('content', description);

      // Restore the default description on unmount so it doesn't leak
      // into whichever page the user navigates to next.
      return () => {
        if (previous) tag.setAttribute('content', previous);
      };
    }
  }, [title, description]);
}
