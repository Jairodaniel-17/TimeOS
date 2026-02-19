'use client';

import { useEffect, useRef, useState } from 'react';

interface LuckysheetWrapperProps {
  data: { name: string; data: (string | number)[][] }[];
}

let luckysheetIdCounter = 0;

export default function LuckysheetWrapper({ data }: LuckysheetWrapperProps) {
  const containerId = `luckysheet-container-${++luckysheetIdCounter}`;
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLuckysheet = async () => {
      if ((window as any).luckysheet) {
        setReady(true);
        return;
      }

      const jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
      jqueryScript.async = true;
      document.body.appendChild(jqueryScript);

      jqueryScript.onload = () => {
        const mousewheelScript = document.createElement('script');
        mousewheelScript.src = 'https://cdn.jsdelivr.net/npm/jquery-mousewheel@3.1.13/jquery.mousewheel.min.js';
        mousewheelScript.async = true;
        document.body.appendChild(mousewheelScript);

        mousewheelScript.onload = () => {
          const links = [
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/css/pluginsCss.css',
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/plugins.css',
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/css/luckysheet.css',
          ];

          links.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
          });

          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/luckysheet.umd.js';
          script.async = true;
          script.onload = () => {
            setReady(true);
          };
          document.body.appendChild(script);
        };
      };
    };

    loadLuckysheet();
  }, []);

  useEffect(() => {
    if (!ready || initialized.current || typeof window === 'undefined') return;
    initialized.current = true;

    const initializeSheet = () => {
      if (!(window as any).luckysheet) return;

      try {
        (window as any).luckysheet.create({
          container: containerId,
          title: 'TimeOS - Hoja de Cálculo',
          lang: 'es',
          showinfobar: true,
          showtoolbar: true,
          showstatisticBar: true,
          enableAddRow: true,
          enableAddBackTop: true,
          data: data,
        });
      } catch (e) {
        console.error('Luckysheet init error:', e);
      }
    };

    setTimeout(initializeSheet, 300);
  }, [ready, containerId]);

  return <div id={containerId} style={{ width: '100%', height: '100%', minHeight: '500px' }} />;
}
