import { useEffect } from "react";

/** Adds one-time, reduced-motion-aware reveals to page sections and data tables. */
export function useScrollMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    root.classList.add("motion-enabled");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("motion-visible");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    const observe = (element: Element, className = "motion-reveal") => {
      if (element.getAttribute("data-motion-observed") === "true") return;
      element.setAttribute("data-motion-observed", "true");
      element.classList.add(className);
      revealObserver.observe(element);
    };

    const attachMotion = (rootNode: ParentNode) => {
      if (rootNode instanceof Element && rootNode.matches("section, table, [data-motion-item]")) {
        observe(rootNode, rootNode.matches("table") ? "motion-table" : "motion-reveal");
      }
      const targets = rootNode.querySelectorAll("section, table, [data-motion-item]");
      targets.forEach((element) => {
        const className = element.matches("table") ? "motion-table" : "motion-reveal";
        observe(element, className);
      });

      // Give card grids a restrained, cascading entrance as they scroll into view.
      rootNode.querySelectorAll("section .grid > *").forEach((element, index) => {
        element.classList.add("motion-stagger-item");
        (element as HTMLElement).style.setProperty("--motion-delay", `${Math.min(index, 6) * 70}ms`);
        observe(element, "motion-reveal");
      });
    };

    attachMotion(document);
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) attachMotion(node);
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver.disconnect();
      root.classList.remove("motion-enabled");
    };
  }, []);
}
