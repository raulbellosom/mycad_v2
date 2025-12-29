import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que resetea el scroll del contenedor principal
 * cuando cambia la ruta de navegación.
 *
 * @param {Object} props
 * @param {React.RefObject} props.containerRef - Referencia al contenedor con scroll
 */
export function ScrollToTop({ containerRef }) {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Solo hacer scroll si realmente cambió la ruta
    if (prevPathname.current !== pathname) {
      if (containerRef?.current) {
        containerRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
      prevPathname.current = pathname;
    }
  }, [pathname, containerRef]);

  return null;
}
